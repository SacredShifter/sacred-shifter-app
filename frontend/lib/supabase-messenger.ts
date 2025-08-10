import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase'

const supabaseUrl = 'https://your-project.supabase.co'
const supabaseAnonKey = 'your-anon-key'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Aura bot user ID - in production this would be a real user account
export const AURA_BOT_ID = '00000000-0000-0000-0000-000000000001'

// Message content types
export interface MessageAttachment {
  type: 'image' | 'audio' | 'video' | 'file' | 'vigil'
  url: string
  meta: {
    name?: string
    size?: number
    code?: string // for vigils
  }
}

export interface MessageContent {
  attachments?: MessageAttachment[]
}

// Presence state for typing indicators and online status
export interface PresenceState {
  user_id: string
  display_name?: string
  avatar_url?: string
  typing?: boolean
  last_seen?: string
}

// Thread with computed fields
export interface ThreadWithUnread {
  thread_id: string
  is_group: boolean
  title: string | null
  created_at: string
  last_message_id: string | null
  last_message_body: string | null
  last_message_created_at: string | null
  last_message_sender_id: string | null
  unread_count: number
  member_count: number
}

// Message with sender info
export interface MessageWithSender {
  id: string
  thread_id: string
  sender_id: string
  body: string | null
  content: MessageContent
  created_at: string
  edited_at: string | null
  reply_to_id: string | null
  sender: {
    id: string
    email: string
    user_metadata: {
      full_name?: string
      avatar_url?: string
    }
  }
  reply_to?: MessageWithSender
}

// Thread member with user info
export interface ThreadMemberWithUser {
  thread_id: string
  user_id: string
  role: string
  last_read_at: string | null
  joined_at: string | null
  user: {
    id: string
    email: string
    user_metadata: {
      full_name?: string
      avatar_url?: string
    }
  }
}

// Upload file to Supabase Storage
export async function uploadFile(file: File, bucket: string = 'attachments'): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file)

  if (error) {
    throw error
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return publicUrl
}

// Call Aura bot (stubbed for now)
export async function callAuraBot(threadId: string, userMessage: string): Promise<void> {
  try {
    // In production, this would call the Edge Function
    // For now, we'll simulate a bot response
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const botResponses = [
      "I sense great wisdom in your question. Let me reflect on this...",
      "The universe speaks through synchronicities. What patterns do you notice?",
      "Your spiritual journey is unique. Trust the process unfolding within you.",
      "In the quantum field of consciousness, all possibilities exist. What calls to you?",
      "The sacred geometry of your experience reveals deeper truths. Look within.",
    ]
    
    const response = botResponses[Math.floor(Math.random() * botResponses.length)]
    
    // Send bot message
    await supabase.rpc('api_send_message', {
      p_thread_id: threadId,
      p_body: response,
      p_content: {}
    })
  } catch (error) {
    console.error('Failed to call Aura bot:', error)
  }
}
