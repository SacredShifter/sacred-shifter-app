import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import backend from '~backend/client'
import { useToast } from '@/components/ui/use-toast'
import type { Message, MessageContent } from '~backend/messenger/types'
import type { SocialProfile } from '~backend/social/types'

interface MessageWithSender extends Message {
  sender: SocialProfile;
  reply_to?: MessageWithSender;
}

interface ThreadMemberWithUser {
  user_id: string;
  role: string;
  user: SocialProfile;
}

export function useChat(threadId: string | null) {
  const [replyTo, setReplyTo] = useState<MessageWithSender | null>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Fetch messages for the thread
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', threadId],
    queryFn: async () => {
      if (!threadId) return []
      const res = await backend.messenger.listMessages({ threadId });
      // This is a simplification. In a real app, you'd fetch sender profiles separately or join them in the backend.
      return res.messages.map(m => ({...m, sender: { display_name: 'Sender' } })) as any[];
    },
    enabled: !!threadId,
  })

  // Fetch thread members
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['thread-members', threadId],
    queryFn: async (): Promise<ThreadMemberWithUser[]> => {
      if (!threadId) return []
      // This endpoint doesn't exist yet, so we'll mock it.
      // In a real app, you'd have a `messenger.getThreadMembers` endpoint.
      return Promise.resolve([]);
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
    return members.filter(member => {
      // This is a placeholder as last_read_at is not on the member type
      return false;
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
