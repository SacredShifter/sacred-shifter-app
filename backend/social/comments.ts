import { api, APIError } from "encore.dev/api";
import { socialDB } from "./db";
import type { SocialComment } from "./types";

interface ListCommentsRequest {
  postId: string;
}

interface ListCommentsResponse {
  comments: SocialComment[];
}

// Lists comments for a post.
export const listComments = api<ListCommentsRequest, ListCommentsResponse>(
  { expose: true, method: "GET", path: "/social/posts/:postId/comments" },
  async ({ postId }) => {
    const comments = await socialDB.queryAll<SocialComment>`
      SELECT c.*, row_to_json(a) as author
      FROM social_comments c
      JOIN social_profiles a ON c.author_id = a.user_id
      WHERE c.post_id = ${postId}
      ORDER BY c.created_at ASC
    `;
    return { comments };
  }
);

interface CreateCommentRequest {
  postId: string;
  content: string;
}

// Creates a new comment.
export const createComment = api<CreateCommentRequest, { comment: SocialComment }>(
  { expose: true, method: "POST", path: "/social/posts/:postId/comments" },
  async ({ postId, content }) => {
    const authorId = "00000000-0000-0000-0000-000000000000"; // default user
    
    const comment = await socialDB.queryRow<SocialComment>`
      INSERT INTO social_comments (post_id, author_id, content)
      VALUES (${postId}, ${authorId}, ${content})
      RETURNING *
    `;
    if (!comment) {
      throw APIError.internal("failed to create comment");
    }

    const author = await socialDB.queryRow`SELECT * FROM social_profiles WHERE user_id = ${authorId}`;
    
    return { comment: { ...comment, author: author as any } };
  }
);
