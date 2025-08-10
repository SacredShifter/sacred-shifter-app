import { api, APIError } from "encore.dev/api";
import { socialDB } from "./db";

interface SharePostRequest {
  postId: string;
  content?: string;
}

interface SharePostResponse {
  share_id: string;
}

interface ListPostSharesRequest {
  postId: string;
  limit?: number;
  offset?: number;
}

interface ListPostSharesResponse {
  shares: Array<{
    id: string;
    user_id: string;
    content: string | null;
    created_at: Date;
    user: {
      user_id: string;
      username: string;
      display_name: string;
      avatar_url: string | null;
    };
  }>;
  total: number;
  has_more: boolean;
}

interface GetUserSharesRequest {
  userId?: string;
  limit?: number;
  offset?: number;
}

interface GetUserSharesResponse {
  shares: Array<{
    id: string;
    content: string | null;
    created_at: Date;
    post: {
      id: string;
      content: string;
      author: {
        user_id: string;
        username: string;
        display_name: string;
        avatar_url: string | null;
      };
    };
  }>;
  total: number;
  has_more: boolean;
}

// Shares a post.
export const sharePost = api<SharePostRequest, SharePostResponse>(
  { expose: true, method: "POST", path: "/social/posts/:postId/share" },
  async ({ postId, content }) => {
    const userId = "00000000-0000-0000-0000-000000000000"; // default user

    // Check if post exists
    const post = await socialDB.queryRow`
      SELECT id, author_id FROM social_posts WHERE id = ${postId}
    `;

    if (!post) {
      throw APIError.notFound("post not found");
    }

    // Check if user already shared this post
    const existingShare = await socialDB.queryRow`
      SELECT id FROM social_post_shares 
      WHERE post_id = ${postId} AND user_id = ${userId}
    `;

    if (existingShare) {
      throw APIError.alreadyExists("post already shared");
    }

    // Create the share
    const share = await socialDB.queryRow<{ id: string }>`
      INSERT INTO social_post_shares (post_id, user_id, content)
      VALUES (${postId}, ${userId}, ${content})
      RETURNING id
    `;

    if (!share) {
      throw APIError.internal("failed to share post");
    }

    return { share_id: share.id };
  }
);

// Unshares a post.
export const unsharePost = api<{ postId: string }, void>(
  { expose: true, method: "DELETE", path: "/social/posts/:postId/share" },
  async ({ postId }) => {
    const userId = "00000000-0000-0000-0000-000000000000"; // default user

    await socialDB.exec`
      DELETE FROM social_post_shares 
      WHERE post_id = ${postId} AND user_id = ${userId}
    `;
  }
);

// Lists users who shared a post.
export const listPostShares = api<ListPostSharesRequest, ListPostSharesResponse>(
  { expose: true, method: "GET", path: "/social/posts/:postId/shares" },
  async ({ postId, limit = 50, offset = 0 }) => {
    // Get total count
    const countResult = await socialDB.queryRow<{ total: number }>`
      SELECT COUNT(*) as total 
      FROM social_post_shares 
      WHERE post_id = ${postId}
    `;
    const total = countResult?.total || 0;

    // Get shares with user info
    const shares = await socialDB.queryAll<{
      id: string;
      user_id: string;
      content: string | null;
      created_at: Date;
      user: {
        user_id: string;
        username: string;
        display_name: string;
        avatar_url: string | null;
      };
    }>`
      SELECT 
        s.id,
        s.user_id,
        s.content,
        s.created_at,
        row_to_json(p) as user
      FROM social_post_shares s
      JOIN social_profiles p ON s.user_id = p.user_id
      WHERE s.post_id = ${postId}
      ORDER BY s.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return {
      shares: shares || [],
      total,
      has_more: offset + limit < total
    };
  }
);

// Gets posts shared by a user.
export const getUserShares = api<GetUserSharesRequest, GetUserSharesResponse>(
  { expose: true, method: "GET", path: "/social/users/:userId/shares" },
  async ({ userId, limit = 50, offset = 0 }) => {
    const targetUserId = userId || "00000000-0000-0000-0000-000000000000";

    // Get total count
    const countResult = await socialDB.queryRow<{ total: number }>`
      SELECT COUNT(*) as total 
      FROM social_post_shares 
      WHERE user_id = ${targetUserId}
    `;
    const total = countResult?.total || 0;

    // Get shares with post and author info
    const shares = await socialDB.queryAll<{
      id: string;
      content: string | null;
      created_at: Date;
      post: {
        id: string;
        content: string;
        author: {
          user_id: string;
          username: string;
          display_name: string;
          avatar_url: string | null;
        };
      };
    }>`
      SELECT 
        s.id,
        s.content,
        s.created_at,
        json_build_object(
          'id', p.id,
          'content', p.content,
          'author', row_to_json(author)
        ) as post
      FROM social_post_shares s
      JOIN social_posts p ON s.post_id = p.id
      JOIN social_profiles author ON p.author_id = author.user_id
      WHERE s.user_id = ${targetUserId}
      ORDER BY s.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return {
      shares: shares || [],
      total,
      has_more: offset + limit < total
    };
  }
);

// Checks if current user has shared a post.
export const checkPostShared = api<{ postId: string }, { is_shared: boolean }>(
  { expose: true, method: "GET", path: "/social/posts/:postId/share/check" },
  async ({ postId }) => {
    const userId = "00000000-0000-0000-0000-000000000000"; // default user

    const share = await socialDB.queryRow`
      SELECT id FROM social_post_shares 
      WHERE post_id = ${postId} AND user_id = ${userId}
    `;

    return { is_shared: !!share };
  }
);
