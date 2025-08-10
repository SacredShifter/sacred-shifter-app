import { BaseEntity } from "../shared/types";

export interface SocialProfile {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  location: string | null;
  website: string | null;
  birth_date: Date | null;
  interests: string[];
  spiritual_path: string | null;
  experience_level: 'beginner' | 'intermediate' | 'advanced' | 'master' | null;
  is_verified: boolean;
  is_private: boolean;
  follower_count: number;
  following_count: number;
  post_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface PostReaction {
  kind: string;
  count: number;
  user_reacted: boolean;
}

export interface SocialPost {
  id: string;
  author_id: string;
  content: string;
  media_urls: string[];
  visibility: 'public' | 'followers' | 'private';
  reply_to_id: string | null;
  circle_id: string | null;
  is_pinned: boolean;
  tags: string[];
  location: string | null;
  feeling: string | null;
  like_count: number;
  comment_count: number;
  share_count: number;
  created_at: Date;
  updated_at: Date;
  author: SocialProfile;
  reactions: PostReaction[];
  is_shared?: boolean;
  shared_by?: string;
  share_content?: string;
}

export interface SocialComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  like_count: number;
  reply_to_id: string | null;
  parent_id: string | null;
  depth: number;
  created_at: Date;
  updated_at: Date;
  author: SocialProfile;
  replies?: SocialComment[];
  reply_count?: number;
}

export interface SocialCircle {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  is_public: boolean;
  member_count: number;
  created_at: Date;
  updated_at: Date;
  is_member: boolean;
  owner: SocialProfile;
}

export interface SocialFollow {
  follower_id: string;
  following_id: string;
  created_at: Date;
}

export interface SocialNotification {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'post_share';
  actor_id: string | null;
  target_id: string | null;
  content: string | null;
  is_read: boolean;
  created_at: Date;
  actor?: SocialProfile;
  target_post?: {
    id: string;
    content: string;
  };
}

export interface SocialPostShare {
  id: string;
  post_id: string;
  user_id: string;
  content: string | null;
  created_at: Date;
}
