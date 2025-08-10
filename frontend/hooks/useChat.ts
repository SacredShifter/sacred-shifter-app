import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import backend from '~backend/client'
import { useToast } from '@/components/ui/use-toast'
import type { Message, MessageContent, Thread, ThreadMember } from '~backend/messenger/types'
import type { SocialProfile } from '~backend/social/types'

export function useChat(threadId: string | null) {
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Fetch messages for the thread
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', threadId],
    queryFn: async () => {
      if (!threadId) return []
      const res = await backend.messenger.listMessages({ threadId });
      return res.messages;
    },
    enabled: !!threadId,
  })

  // Fetch thread details (including members)
  const { data: threadData, isLoading: threadLoading } = useQuery({
    queryKey: ['thread', threadId],
    queryFn: async (): Promise<Thread | null> => {
      if (!threadId) return null
      const res = await backend.messenger.get({ threadId });
      return res.thread;
    },
    enabled: !!threadId,
  })
  const members = threadData?.members || [];

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
      return backend.messenger.send({
        threadId,
        body,
        content,
        replyToId
      });
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
      return backend.messenger.edit({ messageId, body, content });
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
      return backend.messenger.del({ messageId });
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
      await backend.messenger.markAsRead({ threadId });
      queryClient.invalidateQueries({ queryKey: ['threads'] })
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }, [threadId, queryClient])

  // Set up realtime subscription for messages
  useEffect(() => {
    if (!threadId) return;

    let stream: any;
    const connect = async () => {
      stream = await backend.messenger.events({ threadId });
      for await (const event of stream) {
        if (event.type === 'newMessage' || event.type === 'messageUpdated' || event.type === 'messageDeleted') {
          queryClient.invalidateQueries({ queryKey: ['messages', threadId] });
          queryClient.invalidateQueries({ queryKey: ['threads'] });
        }
      }
    };

    connect();

    return () => {
      stream?.close();
    }
  }, [threadId, queryClient]);

  // Mark as read when messages change or thread is focused
  useEffect(() => {
    if (messages.length > 0) {
      markRead()
    }
  }, [messages.length, markRead])

  // Calculate read receipts
  const getReadBy = useCallback((messageCreatedAt: string) => {
    const messageTime = new Date(messageCreatedAt).getTime();
    return members.filter(member => {
      if (!member.last_read_at) return false;
      const readTime = new Date(member.last_read_at).getTime();
      return readTime >= messageTime;
    })
  }, [members])

  return {
    messages,
    members,
    thread: threadData,
    isLoading: messagesLoading || threadLoading,
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
