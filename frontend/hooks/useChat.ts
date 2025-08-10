import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, callAuraBot, AURA_BOT_ID, type MessageWithSender, type ThreadMemberWithUser, type MessageContent } from '../lib/supabase-messenger'
import { useToast } from '@/components/ui/use-toast'

export function useChat(threadId: string | null) {
  const [replyTo, setReplyTo] = useState<MessageWithSender | null>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Fetch messages for the thread
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', threadId],
    queryFn: async () => {
      if (!threadId) return []
      
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:auth.users!messages_sender_id_fkey(id, email, user_metadata),
          reply_to:messages!messages_reply_to_id_fkey(
            *,
            sender:auth.users!messages_sender_id_fkey(id, email, user_metadata)
          )
        `)
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as MessageWithSender[]
    },
    enabled: !!threadId,
  })

  // Fetch thread members
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['thread-members', threadId],
    queryFn: async () => {
      if (!threadId) return []
      
      const { data, error } = await supabase
        .from('thread_members')
        .select(`
          *,
          user:auth.users!thread_members_user_id_fkey(id, email, user_metadata)
        `)
        .eq('thread_id', threadId)

      if (error) throw error
      return data as ThreadMemberWithUser[]
    },
    enabled: !!threadId,
  })

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async ({ 
      body, 
      content = {}, 
      replyToId 
    }: { 
      body: string
      content?: MessageContent
      replyToId?: string 
    }) => {
      if (!threadId) throw new Error('No thread selected')
      
      const { error } = await supabase.rpc('api_send_message', {
        p_thread_id: threadId,
        p_body: body,
        p_content: content,
        p_reply_to_id: replyToId
      })
      if (error) throw error

      // If this thread includes Aura bot, trigger bot response
      const hasAura = members.some(member => member.user_id === AURA_BOT_ID)
      if (hasAura && body.trim()) {
        // Call Aura bot asynchronously
        callAuraBot(threadId, body).catch(console.error)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', threadId] })
      queryClient.invalidateQueries({ queryKey: ['threads'] })
      setReplyTo(null)
    },
    onError: (error) => {
      console.error('Failed to send message:', error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    },
  })

  // Edit message
  const editMessageMutation = useMutation({
    mutationFn: async ({ messageId, body, content }: { 
      messageId: string
      body: string
      content?: MessageContent 
    }) => {
      const { error } = await supabase.rpc('api_edit_message', {
        p_message_id: messageId,
        p_body: body,
        p_content: content
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', threadId] })
      toast({
        title: "Message edited",
        description: "Your message has been updated.",
      })
    },
    onError: (error) => {
      console.error('Failed to edit message:', error)
      toast({
        title: "Error",
        description: "Failed to edit message. Please try again.",
        variant: "destructive",
      })
    },
  })

  // Delete message
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase.rpc('api_delete_message', {
        p_message_id: messageId
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', threadId] })
      toast({
        title: "Message deleted",
        description: "Your message has been deleted.",
      })
    },
    onError: (error) => {
      console.error('Failed to delete message:', error)
      toast({
        title: "Error",
        description: "Failed to delete message. Please try again.",
        variant: "destructive",
      })
    },
  })

  // Mark thread as read
  const markRead = useCallback(async () => {
    if (!threadId) return
    
    try {
      const { error } = await supabase.rpc('api_mark_read', {
        p_thread_id: threadId
      })
      if (error) throw error
      
      queryClient.invalidateQueries({ queryKey: ['threads'] })
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }, [threadId, queryClient])

  // Set up realtime subscription for messages
  useEffect(() => {
    if (!threadId) return

    const subscription = supabase
      .channel(`messages-${threadId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `thread_id=eq.${threadId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages', threadId] })
          queryClient.invalidateQueries({ queryKey: ['threads'] })
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${threadId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages', threadId] })
        }
      )
      .on('postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${threadId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages', threadId] })
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [threadId, queryClient])

  // Mark as read when messages change or thread is focused
  useEffect(() => {
    if (messages.length > 0) {
      markRead()
    }
  }, [messages.length, markRead])

  // Calculate read receipts
  const getReadBy = useCallback((messageCreatedAt: string) => {
    return members.filter(member => {
      if (!member.last_read_at) return false
      return new Date(member.last_read_at) >= new Date(messageCreatedAt)
    })
  }, [members])

  return {
    messages,
    members,
    isLoading: messagesLoading || membersLoading,
    replyTo,
    setReplyTo,
    sendMessage: sendMessageMutation.mutateAsync,
    editMessage: editMessageMutation.mutateAsync,
    deleteMessage: deleteMessageMutation.mutateAsync,
    markRead,
    getReadBy,
    isSending: sendMessageMutation.isPending,
  }
}
