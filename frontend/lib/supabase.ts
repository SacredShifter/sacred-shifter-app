import { createClient } from '@supabase/supabase-js'

// TODO: Replace these with your actual Supabase project credentials
// You can find these in your Supabase project settings
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project-ref.supabase.co'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key-here'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      social_circles: {
        Row: {
          id: string
          owner_id: string
          name: string
          description: string | null
          is_public: boolean
          created_at: string
          updated_at: string
          member_count: number
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          description?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
          member_count?: number
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          description?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
          member_count?: number
        }
      }
      social_circle_members: {
        Row: {
          circle_id: string
          user_id: string
          role: string
          joined_at: string
        }
        Insert: {
          circle_id: string
          user_id: string
          role?: string
          joined_at?: string
        }
        Update: {
          circle_id?: string
          user_id?: string
          role?: string
          joined_at?: string
        }
      }
      social_posts: {
        Row: {
          id: string
          author_id: string
          content: string
          media_urls: string[]
          visibility: string
          reply_to_id: string | null
          like_count: number
          comment_count: number
          share_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          content: string
          media_urls?: string[]
          visibility?: string
          reply_to_id?: string | null
          like_count?: number
          comment_count?: number
          share_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          content?: string
          media_urls?: string[]
          visibility?: string
          reply_to_id?: string | null
          like_count?: number
          comment_count?: number
          share_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      social_post_reactions: {
        Row: {
          post_id: string
          user_id: string
          kind: string
          created_at: string | null
        }
        Insert: {
          post_id: string
          user_id: string
          kind: string
          created_at?: string | null
        }
        Update: {
          post_id?: string
          user_id?: string
          kind?: string
          created_at?: string | null
        }
      }
      social_comments: {
        Row: {
          id: string
          post_id: string
          author_id: string
          content: string
          like_count: number
          reply_to_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          author_id: string
          content: string
          like_count?: number
          reply_to_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          author_id?: string
          content?: string
          like_count?: number
          reply_to_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      social_follows: {
        Row: {
          follower_id: string
          following_id: string
          created_at: string | null
        }
        Insert: {
          follower_id: string
          following_id: string
          created_at?: string | null
        }
        Update: {
          follower_id?: string
          following_id?: string
          created_at?: string | null
        }
      }
      threads: {
        Row: {
          id: string
          is_group: boolean
          created_by: string
          title: string | null
          created_at: string
        }
        Insert: {
          id?: string
          is_group?: boolean
          created_by: string
          title?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          is_group?: boolean
          created_by?: string
          title?: string | null
          created_at?: string
        }
      }
      thread_members: {
        Row: {
          thread_id: string
          user_id: string
          role: string
          last_read_at: string | null
          joined_at: string | null
        }
        Insert: {
          thread_id: string
          user_id: string
          role?: string
          last_read_at?: string | null
          joined_at?: string | null
        }
        Update: {
          thread_id?: string
          user_id?: string
          role?: string
          last_read_at?: string | null
          joined_at?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          thread_id: string
          sender_id: string
          body: string | null
          content: any
          created_at: string
          edited_at: string | null
          reply_to_id: string | null
        }
        Insert: {
          id?: string
          thread_id: string
          sender_id: string
          body?: string | null
          content?: any
          created_at?: string
          edited_at?: string | null
          reply_to_id?: string | null
        }
        Update: {
          id?: string
          thread_id?: string
          sender_id?: string
          body?: string | null
          content?: any
          created_at?: string
          edited_at?: string | null
          reply_to_id?: string | null
        }
      }
      social_notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          actor_id: string | null
          target_id: string | null
          content: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          actor_id?: string | null
          target_id?: string | null
          content?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          actor_id?: string | null
          target_id?: string | null
          content?: string | null
          is_read?: boolean
          created_at?: string
        }
      }
      social_profiles: {
        Row: {
          id: string
          user_id: string
          username: string
          display_name: string
          bio: string | null
          avatar_url: string | null
          location: string | null
          website: string | null
          follower_count: number
          following_count: number
          post_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          username: string
          display_name: string
          bio?: string | null
          avatar_url?: string | null
          location?: string | null
          website?: string | null
          follower_count?: number
          following_count?: number
          post_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          username?: string
          display_name?: string
          bio?: string | null
          avatar_url?: string | null
          location?: string | null
          website?: string | null
          follower_count?: number
          following_count?: number
          post_count?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
