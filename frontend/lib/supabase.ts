import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://your-project.supabase.co'
const supabaseAnonKey = 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      circles: {
        Row: {
          id: string
          owner_id: string
          name: string
          slug: string | null
          description: string | null
          is_public: boolean
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          slug?: string | null
          description?: string | null
          is_public?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          slug?: string | null
          description?: string | null
          is_public?: boolean
          created_at?: string
        }
      }
      circle_members: {
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
      posts: {
        Row: {
          id: string
          author_id: string
          circle_id: string | null
          body: string | null
          content: any
          visibility: string
          media: any
          ai_summary: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          circle_id?: string | null
          body?: string | null
          content?: any
          visibility?: string
          media?: any
          ai_summary?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          circle_id?: string | null
          body?: string | null
          content?: any
          visibility?: string
          media?: any
          ai_summary?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      post_reactions: {
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
      comments: {
        Row: {
          id: string
          post_id: string
          author_id: string
          body: string
          content: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          author_id: string
          body: string
          content?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          author_id?: string
          body?: string
          content?: any
          created_at?: string
          updated_at?: string
        }
      }
      follows: {
        Row: {
          follower_id: string
          followee_id: string
          created_at: string | null
        }
        Insert: {
          follower_id: string
          followee_id: string
          created_at?: string | null
        }
        Update: {
          follower_id?: string
          followee_id?: string
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
      notifications: {
        Row: {
          id: string
          user_id: string
          kind: string
          ref: any
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          kind: string
          ref: any
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          kind?: string
          ref?: any
          is_read?: boolean
          created_at?: string
        }
      }
    }
  }
}
