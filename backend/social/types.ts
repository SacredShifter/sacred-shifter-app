import { BaseEntity } from "../shared/types";

export interface SocialProfile {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  website: string | null;
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
  like_count: number;
  comment_count: number;
  share_count: number;
  created_at: Date;
  updated_at: Date;
  author: SocialProfile;
  reactions: PostReaction[];
}

export interface SocialComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  like_count: number;
  reply_to_id: string | null;
  created_at: Date;
  updated_at: Date;
  author: SocialProfile;
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
