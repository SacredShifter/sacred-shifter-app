import { socialDB } from "./db";
import { ModuleError, handleModuleError } from "../shared/errors";
import type {
  SocialProfile,
  SocialPost,
  SocialComment,
  SocialCircle,
  SocialMessage,
  SocialNotification,
  CreatePostRequest,
  CreateCommentRequest,
  CreateCircleRequest,
  SendMessageRequest,
  UpdateProfileRequest,
  ListPostsRequest,
  ListPostsResponse,
  ListCommentsResponse,
  ListCirclesResponse,
  ListMessagesResponse,
  ListNotificationsResponse,
  SocialStats
} from "./types";

export class SocialService {
  private readonly MODULE_NAME = 'social';

  async getOrCreateProfile(userId: string): Promise<SocialProfile> {
    try {
      let profile = await socialDB.queryRow<SocialProfile>`
        SELECT * FROM social_profiles WHERE user_id = ${userId}
      `;

      if (!profile) {
        // Create default profile
        profile = await socialDB.queryRow<SocialProfile>`
          INSERT INTO social_profiles (user_id, username, display_name)
          VALUES (${userId}, ${`user_${userId.slice(-8)}`}, 'Sacred Seeker')
          RETURNING *
        `;

        if (!profile) {
          throw new ModuleError(this.MODULE_NAME, 'getOrCreateProfile', 'Failed to create profile');
        }
      }

      return profile;
    } catch (error) {
      handleModuleError(this.MODULE_NAME, 'getOrCreateProfile', error);
    }
  }

  async updateProfile(userId: string, request: UpdateProfileRequest): Promise<SocialProfile> {
    try {
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (request.display_name !== undefined) {
        updateFields.push(`display_name = $${updateValues.length + 1}`);
        updateValues.push(request.display_name);
      }

      if (request.bio !== undefined) {
        updateFields.push(`bio = $${updateValues.length + 1}`);
        updateValues.push(request.bio);
      }

      if (request.avatar_url !== undefined) {
        updateFields.push(`avatar_url = $${updateValues.length + 1}`);
        updateValues.push(request.avatar_url);
      }

      if (request.location !== undefined) {
        updateFields.push(`location = $${updateValues.length + 1}`);
        updateValues.push(request.location);
      }

      if (request.website !== undefined) {
        updateFields.push(`website = $${updateValues.length + 1}`);
        updateValues.push(request.website);
      }

      if (updateFields.length === 0) {
        throw new ModuleError(this.MODULE_NAME, 'updateProfile', 'No fields to update');
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
        throw new ModuleError(this.MODULE_NAME, 'updateProfile', 'Profile not found');
      }

      return profile;
    } catch (error) {
      handleModuleError(this.MODULE_NAME, 'updateProfile', error);
    }
  }

  async createPost(userId: string, request: CreatePostRequest): Promise<SocialPost> {
    try {
      const post = await socialDB.queryRow<SocialPost>`
        INSERT INTO social_posts (author_id, content, media_urls, visibility, reply_to_id)
        VALUES (${userId}, ${request.content}, ${request.media_urls || []}, 
                ${request.visibility || 'public'}, ${request.reply_to_id})
        RETURNING *
      `;

      if (!post) {
        throw new ModuleError(this.MODULE_NAME, 'createPost', 'Failed to create post');
      }

      // Update user's post count
      await socialDB.exec`
        UPDATE social_profiles SET post_count = post_count + 1 WHERE user_id = ${userId}
      `;

      return post;
    } catch (error) {
      handleModuleError(this.MODULE_NAME, 'createPost', error);
    }
  }

  async listPosts(userId: string, request: ListPostsRequest = {}): Promise<ListPostsResponse> {
    try {
      const limit = request.limit || 20;
      const offset = request.offset || 0;

      let whereConditions = ['1=1'];
      let queryParams: any[] = [];
      let paramIndex = 1;

      if (request.author_id) {
        whereConditions.push(`p.author_id = $${paramIndex}`);
        queryParams.push(request.author_id);
        paramIndex++;
      }

      if (request.following_only) {
        whereConditions.push(`(
          p.author_id = $${paramIndex} OR 
          EXISTS (SELECT 1 FROM social_follows WHERE follower_id = $${paramIndex} AND following_id = p.author_id)
        )`);
        queryParams.push(userId);
        paramIndex++;
      }

      // Only show public posts or posts from followed users
      whereConditions.push(`(
        p.visibility = 'public' OR 
        p.author_id = $${paramIndex} OR
        (p.visibility = 'followers' AND EXISTS (
          SELECT 1 FROM social_follows WHERE follower_id = $${paramIndex} AND following_id = p.author_id
        ))
      )`);
      queryParams.push(userId);
      paramIndex++;

      const whereClause = whereConditions.join(' AND ');

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM social_posts p WHERE ${whereClause}`;
      const countResult = await socialDB.rawQueryRow<{ total: number }>(countQuery, ...queryParams);
      const total = countResult?.total || 0;

      // Get posts with author info and like status
      const postsQuery = `
        SELECT 
          p.*,
          prof.username, prof.display_name, prof.avatar_url,
          CASE WHEN likes.user_id IS NOT NULL THEN TRUE ELSE FALSE END as is_liked
        FROM social_posts p
        JOIN social_profiles prof ON p.author_id = prof.user_id
        LEFT JOIN social_likes likes ON p.id = likes.post_id AND likes.user_id = $${paramIndex}
        WHERE ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}
      `;

      const posts = await socialDB.rawQueryAll<SocialPost & {
        username: string;
        display_name: string;
        avatar_url?: string;
        is_liked: boolean;
      }>(postsQuery, ...queryParams, userId, limit, offset);

      const processedPosts: SocialPost[] = posts.map(post => ({
        id: post.id,
        author_id: post.author_id,
        content: post.content,
        media_urls: post.media_urls,
        visibility: post.visibility,
        reply_to_id: post.reply_to_id,
        like_count: post.like_count,
        comment_count: post.comment_count,
        share_count: post.share_count,
        created_at: post.created_at,
        updated_at: post.updated_at,
        is_liked: post.is_liked,
        author: {
          id: post.author_id,
          user_id: post.author_id,
          username: post.username,
          display_name: post.display_name,
          avatar_url: post.avatar_url,
          bio: '',
          location: '',
          website: '',
          follower_count: 0,
          following_count: 0,
          post_count: 0,
          created_at: post.created_at,
          updated_at: post.updated_at
        }
      }));

      return {
        posts: processedPosts,
        total,
        has_more: offset + limit < total
      };
    } catch (error) {
      handleModuleError(this.MODULE_NAME, 'listPosts', error);
    }
  }

  async toggleLike(userId: string, postId: string): Promise<{ liked: boolean; like_count: number }> {
    try {
      // Check if already liked
      const existingLike = await socialDB.queryRow`
        SELECT * FROM social_likes WHERE user_id = ${userId} AND post_id = ${postId}
      `;

      if (existingLike) {
        // Remove like
        await socialDB.exec`
          DELETE FROM social_likes WHERE user_id = ${userId} AND post_id = ${postId}
        `;
      } else {
        // Add like
        await socialDB.exec`
          INSERT INTO social_likes (user_id, post_id) VALUES (${userId}, ${postId})
        `;
      }

      // Get updated like count
      const post = await socialDB.queryRow<{ like_count: number }>`
        SELECT like_count FROM social_posts WHERE id = ${postId}
      `;

      return {
        liked: !existingLike,
        like_count: post?.like_count || 0
      };
    } catch (error) {
      handleModuleError(this.MODULE_NAME, 'toggleLike', error);
    }
  }

  async createComment(userId: string, request: CreateCommentRequest): Promise<SocialComment> {
    try {
      const comment = await socialDB.queryRow<SocialComment>`
        INSERT INTO social_comments (post_id, author_id, content, reply_to_id)
        VALUES (${request.post_id}, ${userId}, ${request.content}, ${request.reply_to_id})
        RETURNING *
      `;

      if (!comment) {
        throw new ModuleError(this.MODULE_NAME, 'createComment', 'Failed to create comment');
      }

      return comment;
    } catch (error) {
      handleModuleError(this.MODULE_NAME, 'createComment', error);
    }
  }

  async listComments(postId: string, userId: string): Promise<ListCommentsResponse> {
    try {
      const comments = await socialDB.queryAll<SocialComment & {
        username: string;
        display_name: string;
        avatar_url?: string;
        is_liked: boolean;
      }>`
        SELECT 
          c.*,
          prof.username, prof.display_name, prof.avatar_url,
          CASE WHEN likes.user_id IS NOT NULL THEN TRUE ELSE FALSE END as is_liked
        FROM social_comments c
        JOIN social_profiles prof ON c.author_id = prof.user_id
        LEFT JOIN social_likes likes ON c.id = likes.post_id AND likes.user_id = ${userId}
        WHERE c.post_id = ${postId}
        ORDER BY c.created_at ASC
      `;

      const processedComments: SocialComment[] = comments.map(comment => ({
        id: comment.id,
        post_id: comment.post_id,
        author_id: comment.author_id,
        content: comment.content,
        like_count: comment.like_count,
        reply_to_id: comment.reply_to_id,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        is_liked: comment.is_liked,
        author: {
          id: comment.author_id,
          user_id: comment.author_id,
          username: comment.username,
          display_name: comment.display_name,
          avatar_url: comment.avatar_url,
          bio: '',
          location: '',
          website: '',
          follower_count: 0,
          following_count: 0,
          post_count: 0,
          created_at: comment.created_at,
          updated_at: comment.updated_at
        }
      }));

      return {
        comments: processedComments,
        total: comments.length,
        has_more: false
      };
    } catch (error) {
      handleModuleError(this.MODULE_NAME, 'listComments', error);
    }
  }

  async listCircles(userId: string): Promise<ListCirclesResponse> {
    try {
      const circles = await socialDB.queryAll<SocialCircle & {
        owner_username: string;
        owner_display_name: string;
        is_member: boolean;
      }>`
        SELECT 
          c.*,
          prof.username as owner_username,
          prof.display_name as owner_display_name,
          CASE WHEN members.user_id IS NOT NULL THEN TRUE ELSE FALSE END as is_member
        FROM social_circles c
        JOIN social_profiles prof ON c.owner_id = prof.user_id
        LEFT JOIN social_circle_members members ON c.id = members.circle_id AND members.user_id = ${userId}
        WHERE c.is_public = TRUE OR members.user_id IS NOT NULL
        ORDER BY c.created_at DESC
      `;

      const processedCircles: SocialCircle[] = circles.map(circle => ({
        id: circle.id,
        name: circle.name,
        description: circle.description,
        owner_id: circle.owner_id,
        is_public: circle.is_public,
        member_count: circle.member_count,
        created_at: circle.created_at,
        updated_at: circle.updated_at,
        is_member: circle.is_member,
        owner: {
          id: circle.owner_id,
          user_id: circle.owner_id,
          username: circle.owner_username,
          display_name: circle.owner_display_name,
          bio: '',
          avatar_url: '',
          location: '',
          website: '',
          follower_count: 0,
          following_count: 0,
          post_count: 0,
          created_at: circle.created_at,
          updated_at: circle.updated_at
        }
      }));

      return {
        circles: processedCircles,
        total: circles.length,
        has_more: false
      };
    } catch (error) {
      handleModuleError(this.MODULE_NAME, 'listCircles', error);
    }
  }

  async createCircle(userId: string, request: CreateCircleRequest): Promise<SocialCircle> {
    try {
      const circle = await socialDB.queryRow<SocialCircle>`
        INSERT INTO social_circles (name, description, owner_id, is_public)
        VALUES (${request.name}, ${request.description}, ${userId}, ${request.is_public || true})
        RETURNING *
      `;

      if (!circle) {
        throw new ModuleError(this.MODULE_NAME, 'createCircle', 'Failed to create circle');
      }

      // Add owner as member
      await socialDB.exec`
        INSERT INTO social_circle_members (circle_id, user_id, role)
        VALUES (${circle.id}, ${userId}, 'owner')
      `;

      return circle;
    } catch (error) {
      handleModuleError(this.MODULE_NAME, 'createCircle', error);
    }
  }

  async joinCircle(userId: string, circleId: string): Promise<void> {
    try {
      await socialDB.exec`
        INSERT INTO social_circle_members (circle_id, user_id, role)
        VALUES (${circleId}, ${userId}, 'member')
        ON CONFLICT (circle_id, user_id) DO NOTHING
      `;

      // Update member count
      await socialDB.exec`
        UPDATE social_circles 
        SET member_count = (SELECT COUNT(*) FROM social_circle_members WHERE circle_id = ${circleId})
        WHERE id = ${circleId}
      `;
    } catch (error) {
      handleModuleError(this.MODULE_NAME, 'joinCircle', error);
    }
  }

  async leaveCircle(userId: string, circleId: string): Promise<void> {
    try {
      await socialDB.exec`
        DELETE FROM social_circle_members 
        WHERE circle_id = ${circleId} AND user_id = ${userId} AND role != 'owner'
      `;

      // Update member count
      await socialDB.exec`
        UPDATE social_circles 
        SET member_count = (SELECT COUNT(*) FROM social_circle_members WHERE circle_id = ${circleId})
        WHERE id = ${circleId}
      `;
    } catch (error) {
      handleModuleError(this.MODULE_NAME, 'leaveCircle', error);
    }
  }

  async sendMessage(userId: string, request: SendMessageRequest): Promise<SocialMessage> {
    try {
      const message = await socialDB.queryRow<SocialMessage>`
        INSERT INTO social_messages (sender_id, recipient_id, content)
        VALUES (${userId}, ${request.recipient_id}, ${request.content})
        RETURNING *
      `;

      if (!message) {
        throw new ModuleError(this.MODULE_NAME, 'sendMessage', 'Failed to send message');
      }

      return message;
    } catch (error) {
      handleModuleError(this.MODULE_NAME, 'sendMessage', error);
    }
  }

  async listMessages(userId: string): Promise<ListMessagesResponse> {
    try {
      const messages = await socialDB.queryAll<SocialMessage & {
        sender_username: string;
        sender_display_name: string;
        recipient_username: string;
        recipient_display_name: string;
      }>`
        SELECT 
          m.*,
          sender.username as sender_username,
          sender.display_name as sender_display_name,
          recipient.username as recipient_username,
          recipient.display_name as recipient_display_name
        FROM social_messages m
        JOIN social_profiles sender ON m.sender_id = sender.user_id
        JOIN social_profiles recipient ON m.recipient_id = recipient.user_id
        WHERE m.sender_id = ${userId} OR m.recipient_id = ${userId}
        ORDER BY m.created_at DESC
        LIMIT 50
      `;

      const processedMessages: SocialMessage[] = messages.map(message => ({
        id: message.id,
        sender_id: message.sender_id,
        recipient_id: message.recipient_id,
        content: message.content,
        is_read: message.is_read,
        created_at: message.created_at,
        updated_at: message.updated_at,
        sender: {
          id: message.sender_id,
          user_id: message.sender_id,
          username: message.sender_username,
          display_name: message.sender_display_name,
          bio: '',
          avatar_url: '',
          location: '',
          website: '',
          follower_count: 0,
          following_count: 0,
          post_count: 0,
          created_at: message.created_at,
          updated_at: message.updated_at
        },
        recipient: {
          id: message.recipient_id,
          user_id: message.recipient_id,
          username: message.recipient_username,
          display_name: message.recipient_display_name,
          bio: '',
          avatar_url: '',
          location: '',
          website: '',
          follower_count: 0,
          following_count: 0,
          post_count: 0,
          created_at: message.created_at,
          updated_at: message.updated_at
        }
      }));

      return {
        messages: processedMessages,
        total: messages.length,
        has_more: false
      };
    } catch (error) {
      handleModuleError(this.MODULE_NAME, 'listMessages', error);
    }
  }

  async getStats(): Promise<SocialStats> {
    try {
      const stats = await socialDB.queryRow<{
        total_posts: number;
        total_users: number;
        total_circles: number;
        posts_today: number;
      }>`
        SELECT 
          (SELECT COUNT(*) FROM social_posts) as total_posts,
          (SELECT COUNT(*) FROM social_profiles) as total_users,
          (SELECT COUNT(*) FROM social_circles) as total_circles,
          (SELECT COUNT(*) FROM social_posts WHERE created_at >= CURRENT_DATE) as posts_today
      `;

      return {
        total_posts: stats?.total_posts || 0,
        total_users: stats?.total_users || 0,
        total_circles: stats?.total_circles || 0,
        posts_today: stats?.posts_today || 0,
        trending_tags: [] // TODO: Implement hashtag extraction and trending
      };
    } catch (error) {
      handleModuleError(this.MODULE_NAME, 'getStats', error);
    }
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: string }> {
    try {
      await socialDB.queryRow`SELECT 1`;
      return { status: 'healthy', details: 'Database connection successful' };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
