import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type Thread = Database['public']['Tables']['threads']['Row'] & {
  members: Array<{
    user_id: string
    user: {
      id: string
      email: string
      user_metadata: {
        full_name?: string
        avatar_url?: string
      }
    }
    last_read_at: string | null
  }>
  last_message?: {
    id: string
    body: string | null
    sender_id: string
    created_at: string
  }
  unread_count: number
}

type Message = Database['public']['Tables']['messages']['Row'] & {
  sender: {
    id: string
    email: string
    user_metadata: {
      full_name?: string
      avatar_url?: string
    }
  }
  reply_to?: {
    id: string
    body: string | null
    sender: {
      user_metadata: {
        full_name?: string
      }
    }
  }
}

export function useMessages() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [currentThread, setCurrentThread] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchThreads = async () => {
    try {
      setLoading(true)
      
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data, error } = await supabase
        .from('thread_members')
        .select(`
          thread:threads(
            *,
            members:thread_members(
              user_id,
              last_read_at,
              user:auth.users!thread_members_user_id_fkey(id, email, user_metadata)
            ),
            last_message:messages(id, body, sender_id, created_at)
          )
        `)
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const processedThreads = data?.map(item => {
        const thread = item.thread
        const lastMessage = thread.last_message?.[0]
        
        return {
          ...thread,
          last_message: lastMessage,
          unread_count: 0 // TODO: Calculate based on last_read_at
        }
      }) || []

      setThreads(processedThreads)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch threads')
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (threadId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:auth.users!messages_sender_id_fkey(id, email, user_metadata),
          reply_to:messages!messages_reply_to_id_fkey(
            id,
            body,
            sender:auth.users!messages_sender_id_fkey(user_metadata)
          )
        `)
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true })

      if (error) throw error

      setMessages(data || [])
      setCurrentThread(threadId)

      // Mark as read
      const { data: user } = await supabase.auth.getUser()
      if (user.user) {
        await supabase
          .from('thread_members')
          .update({ last_read_at: new Date().toISOString() })
          .eq('thread_id', threadId)
          .eq('user_id', user.user.id)
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err)
    }
  }

  const sendMessage = async (threadId: string, body: string, replyToId?: string) => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('messages')
        .insert({
          thread_id: threadId,
          sender_id: user.user.id,
          body,
          reply_to_id: replyToId
        })

      if (error) throw error

      // Refresh messages if viewing this thread
      if (currentThread === threadId) {
        fetchMessages(threadId)
      }
    } catch (err) {
      throw err
    }
  }

  const createThread = async (userIds: string[], isGroup = false, title?: string) => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Not authenticated')

      // Create thread
      const { data: thread, error: threadError } = await supabase
        .from('threads')
        .insert({
          created_by: user.user.id,
          is_group: isGroup,
          title
        })
        .select()
        .single()

      if (threadError) throw threadError

      // Add members
      const members = [user.user.id, ...userIds].map(userId => ({
        thread_id: thread.id,
        user_id: userId,
        role: userId === user.user.id ? 'owner' : 'member'
      }))

      const { error: membersError } = await supabase
        .from('thread_members')
        .insert(members)

      if (membersError) throw membersError

      // Refresh threads
      fetchThreads()

      return thread
    } catch (err) {
      throw err
    }
  }

  useEffect(() => {
    fetchThreads()

    // Set up real-time subscription for messages
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          if (currentThread === payload.new.thread_id) {
            fetchMessages(currentThread)
          }
          fetchThreads() // Update thread list with new last message
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [currentThread])

  return {
    threads,
    messages,
    currentThread,
    loading,
    error,
    fetchMessages,
    sendMessage,
    createThread,
    refresh: fetchThreads
  }
}
