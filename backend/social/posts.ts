import { api, APIError } from "encore.dev/api";
import { socialDB } from "./db";
import type { SocialPost } from "./types";

interface CreatePostRequest {
  content: string;
  visibility: 'public' | 'followers' | 'private';
  media_urls?: string[];
  circle_id?: string;
}

// Creates a new post.
export const createPost = api<CreatePostRequest, { post: SocialPost }>(
  { expose: true, method: "POST", path: "/social/posts" },
  async (req) => {
    const authorId = "00000000-0000-0000-0000-000000000000"; // default user
    
    const post = await socialDB.queryRow<SocialPost>`
      INSERT INTO social_posts (author_id, content, visibility, media_urls, circle_id)
      VALUES (${authorId}, ${req.content}, ${req.visibility}, ${req.media_urls || []}, ${req.circle_id})
      RETURNING *
    `;
    if (!post) {
      throw APIError.internal("failed to create post");
    }
    
    const author = await socialDB.queryRow`SELECT * FROM social_profiles WHERE user_id = ${authorId}`;
    
    return { post: { ...post, author: author as any, reactions: [] } };
  }
);

interface ListPostsResponse {
  posts: SocialPost[];
}

// Lists posts for the feed.
export const listPosts = api<{ circle_id?: string }, ListPostsResponse>(
  { expose: true, method: "GET", path: "/social/posts" },
  async ({ circle_id }) => {
    const userId = "00000000-0000-0000-0000-000000000000"; // default user
    
    let query = `
      SELECT
        p.*,
        row_to_json(a) as author,
        (
          SELECT json_agg(r)
          FROM (
            SELECT
              pr.kind,
              count(*)::int as count,
              EXISTS(SELECT 1 FROM social_post_reactions WHERE post_id = p.id AND user_id = $1 AND kind = pr.kind) as user_reacted
            FROM social_post_reactions pr
            WHERE pr.post_id = p.id
            GROUP BY pr.kind
          ) r
        ) as reactions
      FROM social_posts p
      JOIN social_profiles a ON p.author_id = a.user_id
    `;
    
    const params: any[] = [userId];
    
    if (circle_id) {
      query += ` WHERE p.circle_id = $2`;
      params.push(circle_id);
    }
    
    query += ` ORDER BY p.created_at DESC LIMIT 50`;

    const posts = await socialDB.rawQueryAll<SocialPost>(query, ...params);
    
    posts.forEach(p => {
      if (!p.reactions) {
        p.reactions = [];
      }
    });

    return { posts };
  }
);

interface ToggleReactionRequest {
  postId: string;
  kind: string;
}

// Toggles a reaction on a post.
export const toggleReaction = api<ToggleReactionRequest, void>(
  { expose: true, method: "POST", path: "/social/posts/:postId/reactions" },
  async ({ postId, kind }) => {
    const userId = "00000000-0000-0000-0000-000000000000"; // default user

    const existing = await socialDB.queryRow`
      SELECT * FROM social_post_reactions
      WHERE post_id = ${postId} AND user_id = ${userId} AND kind = ${kind}
    `;

    if (existing) {
      await socialDB.exec`
        DELETE FROM social_post_reactions
        WHERE post_id = ${postId} AND user_id = ${userId} AND kind = ${kind}
      `;
    } else {
      await socialDB.exec`
        INSERT INTO social_post_reactions (post_id, user_id, kind)
        VALUES (${postId}, ${userId}, ${kind})
      `;
    }
  }
);
