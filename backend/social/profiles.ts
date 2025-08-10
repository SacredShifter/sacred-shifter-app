import { api, APIError } from "encore.dev/api";
import { socialDB } from "./db";
import type { SocialProfile } from "./types";

interface GetProfileRequest {
  userId?: string;
}

interface UpdateProfileRequest {
  display_name?: string;
  bio?: string;
  location?: string;
  website?: string;
  avatar_url?: string;
  cover_image_url?: string;
  interests?: string[];
  spiritual_path?: string;
  experience_level?: 'beginner' | 'intermediate' | 'advanced' | 'master';
  is_private?: boolean;
}

interface SearchProfilesRequest {
  query?: string;
  interests?: string[];
  experience_level?: string;
  limit?: number;
  offset?: number;
}

interface SearchProfilesResponse {
  profiles: SocialProfile[];
  total: number;
  has_more: boolean;
}

interface ProfileStatsResponse {
  posts_count: number;
  followers_count: number;
  following_count: number;
  likes_received: number;
  comments_received: number;
  shares_received: number;
  join_date: Date;
  is_following: boolean;
  is_followed_by: boolean;
}

// Gets a user's profile.
export const getProfile = api<GetProfileRequest, SocialProfile>(
  { expose: true, method: "GET", path: "/social/users/:userId/profile" },
  async ({ userId }) => {
    const targetUserId = userId || "00000000-0000-0000-0000-000000000000";
    
    const profile = await socialDB.queryRow<SocialProfile>`
      SELECT * FROM social_profiles WHERE user_id = ${targetUserId}
    `;

    if (!profile) {
      throw APIError.notFound("user profile not found");
    }

    return profile;
  }
);

// Updates the current user's profile.
export const updateProfile = api<UpdateProfileRequest, SocialProfile>(
  { expose: true, method: "PUT", path: "/social/profile" },
  async (req) => {
    const userId = "00000000-0000-0000-0000-000000000000"; // default user

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (req.display_name !== undefined) {
      updateFields.push(`display_name = $${paramIndex}`);
      updateValues.push(req.display_name);
      paramIndex++;
    }

    if (req.bio !== undefined) {
      updateFields.push(`bio = $${paramIndex}`);
      updateValues.push(req.bio);
      paramIndex++;
    }

    if (req.location !== undefined) {
      updateFields.push(`location = $${paramIndex}`);
      updateValues.push(req.location);
      paramIndex++;
    }

    if (req.website !== undefined) {
      updateFields.push(`website = $${paramIndex}`);
      updateValues.push(req.website);
      paramIndex++;
    }

    if (req.avatar_url !== undefined) {
      updateFields.push(`avatar_url = $${paramIndex}`);
      updateValues.push(req.avatar_url);
      paramIndex++;
    }

    if (req.cover_image_url !== undefined) {
      updateFields.push(`cover_image_url = $${paramIndex}`);
      updateValues.push(req.cover_image_url);
      paramIndex++;
    }

    if (req.interests !== undefined) {
      updateFields.push(`interests = $${paramIndex}`);
      updateValues.push(req.interests);
      paramIndex++;
    }

    if (req.spiritual_path !== undefined) {
      updateFields.push(`spiritual_path = $${paramIndex}`);
      updateValues.push(req.spiritual_path);
      paramIndex++;
    }

    if (req.experience_level !== undefined) {
      updateFields.push(`experience_level = $${paramIndex}`);
      updateValues.push(req.experience_level);
      paramIndex++;
    }

    if (req.is_private !== undefined) {
      updateFields.push(`is_private = $${paramIndex}`);
      updateValues.push(req.is_private);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      throw APIError.invalidArgument("no fields to update");
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(userId);

    const query = `
      UPDATE social_profiles
      SET ${updateFields.join(', ')}
      WHERE user_id = $${updateValues.length}
      RETURNING *
    `;

    const profile = await socialDB.rawQueryRow<SocialProfile>(query, ...updateValues);

    if (!profile) {
      throw APIError.notFound("profile not found");
    }

    return profile;
  }
);

// Searches for user profiles.
export const searchProfiles = api<SearchProfilesRequest, SearchProfilesResponse>(
  { expose: true, method: "GET", path: "/social/users/search" },
  async ({ query, interests, experience_level, limit = 20, offset = 0 }) => {
    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramIndex = 1;

    // Text search
    if (query && query.trim()) {
      whereConditions.push(`(
        display_name ILIKE $${paramIndex} OR 
        username ILIKE $${paramIndex} OR 
        bio ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${query.trim()}%`);
      paramIndex++;
    }

    // Filter by interests
    if (interests && interests.length > 0) {
      whereConditions.push(`interests && $${paramIndex}`);
      queryParams.push(interests);
      paramIndex++;
    }

    // Filter by experience level
    if (experience_level) {
      whereConditions.push(`experience_level = $${paramIndex}`);
      queryParams.push(experience_level);
      paramIndex++;
    }

    // Exclude private profiles (in a real app, you'd check if current user follows them)
    whereConditions.push(`is_private = false`);

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM social_profiles ${whereClause}`;
    const countResult = await socialDB.rawQueryRow<{ total: number }>(countQuery, ...queryParams);
    const total = countResult?.total || 0;

    // Get profiles
    const profilesQuery = `
      SELECT * FROM social_profiles 
      ${whereClause}
      ORDER BY follower_count DESC, display_name ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const profiles = await socialDB.rawQueryAll<SocialProfile>(
      profilesQuery,
      ...queryParams,
      limit,
      offset
    );

    return {
      profiles: profiles || [],
      total,
      has_more: offset + limit < total
    };
  }
);

// Gets detailed profile statistics.
export const getProfileStats = api<GetProfileRequest, ProfileStatsResponse>(
  { expose: true, method: "GET", path: "/social/users/:userId/stats" },
  async ({ userId }) => {
    const targetUserId = userId || "00000000-0000-0000-0000-000000000000";
    const currentUserId = "00000000-0000-0000-0000-000000000000";

    const stats = await socialDB.queryRow<ProfileStatsResponse>`
      SELECT 
        p.post_count as posts_count,
        p.follower_count as followers_count,
        p.following_count as following_count,
        COALESCE(likes.total, 0) as likes_received,
        COALESCE(comments.total, 0) as comments_received,
        COALESCE(shares.total, 0) as shares_received,
        p.created_at as join_date,
        EXISTS(
          SELECT 1 FROM social_follows 
          WHERE follower_id = ${currentUserId} AND following_id = ${targetUserId}
        ) as is_following,
        EXISTS(
          SELECT 1 FROM social_follows 
          WHERE follower_id = ${targetUserId} AND following_id = ${currentUserId}
        ) as is_followed_by
      FROM social_profiles p
      LEFT JOIN (
        SELECT 
          posts.author_id,
          COUNT(reactions.user_id) as total
        FROM social_posts posts
        LEFT JOIN social_post_reactions reactions ON posts.id = reactions.post_id AND reactions.kind = 'like'
        WHERE posts.author_id = ${targetUserId}
        GROUP BY posts.author_id
      ) likes ON p.user_id = likes.author_id
      LEFT JOIN (
        SELECT 
          posts.author_id,
          COUNT(comments.id) as total
        FROM social_posts posts
        LEFT JOIN social_comments comments ON posts.id = comments.post_id
        WHERE posts.author_id = ${targetUserId}
        GROUP BY posts.author_id
      ) comments ON p.user_id = comments.author_id
      LEFT JOIN (
        SELECT 
          posts.author_id,
          COUNT(shares.id) as total
        FROM social_posts posts
        LEFT JOIN social_post_shares shares ON posts.id = shares.post_id
        WHERE posts.author_id = ${targetUserId}
        GROUP BY posts.author_id
      ) shares ON p.user_id = shares.author_id
      WHERE p.user_id = ${targetUserId}
    `;

    if (!stats) {
      throw APIError.notFound("user not found");
    }

    return stats;
  }
);

// Gets trending profiles.
export const getTrendingProfiles = api<{ limit?: number }, { profiles: SocialProfile[] }>(
  { expose: true, method: "GET", path: "/social/users/trending" },
  async ({ limit = 10 }) => {
    // Get profiles with recent activity and high engagement
    const profiles = await socialDB.queryAll<SocialProfile>`
      SELECT DISTINCT p.*
      FROM social_profiles p
      JOIN social_posts posts ON p.user_id = posts.author_id
      WHERE posts.created_at >= NOW() - INTERVAL '7 days'
        AND p.is_private = false
      ORDER BY 
        (p.follower_count + posts.like_count + posts.comment_count) DESC,
        p.updated_at DESC
      LIMIT ${limit}
    `;

    return {
      profiles: profiles || []
    };
  }
);

// Gets profiles by interests.
export const getProfilesByInterests = api<{ interests: string[]; limit?: number }, { profiles: SocialProfile[] }>(
  { expose: true, method: "POST", path: "/social/users/by-interests" },
  async ({ interests, limit = 20 }) => {
    if (!interests || interests.length === 0) {
      return { profiles: [] };
    }

    const profiles = await socialDB.queryAll<SocialProfile>`
      SELECT *
      FROM social_profiles
      WHERE interests && ${interests}
        AND is_private = false
        AND user_id != ${"00000000-0000-0000-0000-000000000000"}
      ORDER BY 
        (
          SELECT COUNT(*) 
          FROM unnest(interests) AS interest 
          WHERE interest = ANY(${interests})
        ) DESC,
        follower_count DESC
      LIMIT ${limit}
    `;

    return {
      profiles: profiles || []
    };
  }
);
