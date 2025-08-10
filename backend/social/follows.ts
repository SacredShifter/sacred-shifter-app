import { api, APIError } from "encore.dev/api";
import { socialDB } from "./db";
import type { SocialProfile } from "./types";

interface FollowUserRequest {
  userId: string;
}

interface ListFollowersRequest {
  userId?: string;
  limit?: number;
  offset?: number;
}

interface ListFollowersResponse {
  followers: SocialProfile[];
  total: number;
  has_more: boolean;
}

interface ListFollowingResponse {
  following: SocialProfile[];
  total: number;
  has_more: boolean;
}

interface FollowStatsResponse {
  follower_count: number;
  following_count: number;
  is_following: boolean;
  is_followed_by: boolean;
}

// Follows a user.
export const followUser = api<FollowUserRequest, void>(
  { expose: true, method: "POST", path: "/social/users/:userId/follow" },
  async ({ userId }) => {
    const currentUserId = "00000000-0000-0000-0000-000000000000"; // default user
    
    if (userId === currentUserId) {
      throw APIError.invalidArgument("cannot follow yourself");
    }

    // Check if user exists
    const targetUser = await socialDB.queryRow`
      SELECT user_id FROM social_profiles WHERE user_id = ${userId}
    `;
    
    if (!targetUser) {
      throw APIError.notFound("user not found");
    }

    // Check if already following
    const existingFollow = await socialDB.queryRow`
      SELECT 1 FROM social_follows 
      WHERE follower_id = ${currentUserId} AND following_id = ${userId}
    `;
    
    if (existingFollow) {
      throw APIError.alreadyExists("already following this user");
    }

    await socialDB.exec`
      INSERT INTO social_follows (follower_id, following_id)
      VALUES (${currentUserId}, ${userId})
    `;
  }
);

// Unfollows a user.
export const unfollowUser = api<FollowUserRequest, void>(
  { expose: true, method: "DELETE", path: "/social/users/:userId/follow" },
  async ({ userId }) => {
    const currentUserId = "00000000-0000-0000-0000-000000000000"; // default user
    
    const result = await socialDB.exec`
      DELETE FROM social_follows 
      WHERE follower_id = ${currentUserId} AND following_id = ${userId}
    `;
  }
);

// Lists followers of a user.
export const listFollowers = api<ListFollowersRequest, ListFollowersResponse>(
  { expose: true, method: "GET", path: "/social/users/:userId/followers" },
  async ({ userId, limit = 50, offset = 0 }) => {
    const targetUserId = userId || "00000000-0000-0000-0000-000000000000";
    
    // Get total count
    const countResult = await socialDB.queryRow<{ total: number }>`
      SELECT COUNT(*) as total 
      FROM social_follows f
      WHERE f.following_id = ${targetUserId}
    `;
    const total = countResult?.total || 0;

    // Get followers
    const followers = await socialDB.queryAll<SocialProfile>`
      SELECT p.*
      FROM social_profiles p
      JOIN social_follows f ON p.user_id = f.follower_id
      WHERE f.following_id = ${targetUserId}
      ORDER BY f.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return {
      followers: followers || [],
      total,
      has_more: offset + limit < total
    };
  }
);

// Lists users that a user is following.
export const listFollowing = api<ListFollowersRequest, ListFollowingResponse>(
  { expose: true, method: "GET", path: "/social/users/:userId/following" },
  async ({ userId, limit = 50, offset = 0 }) => {
    const targetUserId = userId || "00000000-0000-0000-0000-000000000000";
    
    // Get total count
    const countResult = await socialDB.queryRow<{ total: number }>`
      SELECT COUNT(*) as total 
      FROM social_follows f
      WHERE f.follower_id = ${targetUserId}
    `;
    const total = countResult?.total || 0;

    // Get following
    const following = await socialDB.queryAll<SocialProfile>`
      SELECT p.*
      FROM social_profiles p
      JOIN social_follows f ON p.user_id = f.following_id
      WHERE f.follower_id = ${targetUserId}
      ORDER BY f.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return {
      following: following || [],
      total,
      has_more: offset + limit < total
    };
  }
);

// Gets follow statistics for a user.
export const getFollowStats = api<{ userId?: string }, FollowStatsResponse>(
  { expose: true, method: "GET", path: "/social/users/:userId/follow-stats" },
  async ({ userId }) => {
    const targetUserId = userId || "00000000-0000-0000-0000-000000000000";
    const currentUserId = "00000000-0000-0000-0000-000000000000";

    const stats = await socialDB.queryRow<{
      follower_count: number;
      following_count: number;
      is_following: boolean;
      is_followed_by: boolean;
    }>`
      SELECT 
        p.follower_count,
        p.following_count,
        EXISTS(
          SELECT 1 FROM social_follows 
          WHERE follower_id = ${currentUserId} AND following_id = ${targetUserId}
        ) as is_following,
        EXISTS(
          SELECT 1 FROM social_follows 
          WHERE follower_id = ${targetUserId} AND following_id = ${currentUserId}
        ) as is_followed_by
      FROM social_profiles p
      WHERE p.user_id = ${targetUserId}
    `;

    if (!stats) {
      throw APIError.notFound("user not found");
    }

    return stats;
  }
);

// Gets mutual followers between current user and target user.
export const getMutualFollowers = api<{ userId: string }, { mutual_followers: SocialProfile[] }>(
  { expose: true, method: "GET", path: "/social/users/:userId/mutual-followers" },
  async ({ userId }) => {
    const currentUserId = "00000000-0000-0000-0000-000000000000";
    
    const mutualFollowers = await socialDB.queryAll<SocialProfile>`
      SELECT DISTINCT p.*
      FROM social_profiles p
      JOIN social_follows f1 ON p.user_id = f1.follower_id
      JOIN social_follows f2 ON p.user_id = f2.follower_id
      WHERE f1.following_id = ${currentUserId} 
        AND f2.following_id = ${userId}
        AND p.user_id != ${currentUserId}
        AND p.user_id != ${userId}
      ORDER BY p.display_name
      LIMIT 20
    `;

    return {
      mutual_followers: mutualFollowers || []
    };
  }
);

// Gets suggested users to follow.
export const getSuggestedFollows = api<{ limit?: number }, { suggested_users: SocialProfile[] }>(
  { expose: true, method: "GET", path: "/social/suggested-follows" },
  async ({ limit = 10 }) => {
    const currentUserId = "00000000-0000-0000-0000-000000000000";
    
    // Get users that current user's follows are following (friends of friends)
    // but current user is not following yet
    const suggestedUsers = await socialDB.queryAll<SocialProfile>`
      SELECT DISTINCT p.*, 
        COUNT(f2.follower_id) as mutual_connections
      FROM social_profiles p
      JOIN social_follows f1 ON p.user_id = f1.following_id
      JOIN social_follows f2 ON f1.follower_id = f2.following_id
      WHERE f2.follower_id IN (
        SELECT following_id FROM social_follows WHERE follower_id = ${currentUserId}
      )
      AND p.user_id != ${currentUserId}
      AND NOT EXISTS (
        SELECT 1 FROM social_follows 
        WHERE follower_id = ${currentUserId} AND following_id = p.user_id
      )
      GROUP BY p.user_id, p.username, p.display_name, p.bio, p.avatar_url, 
               p.location, p.website, p.follower_count, p.following_count, 
               p.post_count, p.created_at, p.updated_at, p.cover_image_url,
               p.birth_date, p.interests, p.spiritual_path, p.experience_level,
               p.is_verified, p.is_private
      ORDER BY mutual_connections DESC, p.follower_count DESC
      LIMIT ${limit}
    `;

    return {
      suggested_users: suggestedUsers || []
    };
  }
);
