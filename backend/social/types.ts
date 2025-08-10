import { BaseEntity } from "../shared/types";

export interface SocialProfile extends BaseEntity {
  user_id: string;
  username: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  website?: string;
  follower_count: number;
  following_count: number;
  post_count: number;
}

export interface SocialPost extends BaseEntity {
  author_id: string;
  content: string;
  media_urls: string[];
  visibility: 'public' | 'followers' | 'private';
  reply_to_id?: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  author?: SocialProfile;
  is_liked?: boolean;
  reply_to?: SocialPost;
}

export interface SocialComment extends BaseEntity {
  post_id: string;
  author_id: string;
  content: string;
  like_count: number;
  reply_to_id?: string;
  author?: SocialProfile;
  is_liked?: boolean;
}

export interface SocialCircle extends BaseEntity {
  name: string;
  description?: string;
  owner_id: string;
  is_public: boolean;
  member_count: number;
  owner?: SocialProfile;
  is_member?: boolean;
}

export interface SocialMessage extends BaseEntity {
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  sender?: SocialProfile;
  recipient?: SocialProfile;
}

export interface SocialNotification extends BaseEntity {
  user_id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'message';
  actor_id?: string;
  target_id?: string;
  content?: string;
  is_read: boolean;
  actor?: SocialProfile;
}

export interface CreatePostRequest {
  content: string;
  media_urls?: string[];
  visibility?: 'public' | 'followers' | 'private';
  reply_to_id?: string;
}

export interface CreateCommentRequest {
  post_id: string;
  content: string;
  reply_to_id?: string;
}

export interface CreateCircleRequest {
  name: string;
  description?: string;
  is_public?: boolean;
}

export interface SendMessageRequest {
  recipient_id: string;
  content: string;
}

export interface UpdateProfileRequest {
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  website?: string;
}

export interface ListPostsRequest {
  limit?: number;
  offset?: number;
  author_id?: string;
  circle_id?: string;
  following_only?: boolean;
}

export interface ListPostsResponse {
  posts: SocialPost[];
  total: number;
  has_more: boolean;
}

export interface ListCommentsResponse {
  comments: SocialComment[];
  total: number;
  has_more: boolean;
}

export interface ListCirclesResponse {
  circles: SocialCircle[];
  total: number;
  has_more: boolean;
}

export interface ListMessagesResponse {
  messages: SocialMessage[];
  total: number;
  has_more: boolean;
}

export interface ListNotificationsResponse {
  notifications: SocialNotification[];
  unread_count: number;
}

export interface SocialStats {
  total_posts: number;
  total_users: number;
  total_circles: number;
  posts_today: number;
  trending_tags: Array<{ tag: string; count: number }>;
}
