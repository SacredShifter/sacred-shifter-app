import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import backend from '~backend/client'
import { useToast } from '@/components/ui/use-toast'
import { AURA_BOT_ID } from '../config'

export function useThreads() {
  const [searchTerm, setSearchTerm] = useState('')
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Fetch threads
  const { data, isLoading, error } = useQuery({
    queryKey: ['threads'],
    queryFn: async () => {
      const res = await backend.messenger.listThreads();
      return res.threads;
    },
  })
  const threads = data || [];

  // Filter threads based on search
  const filteredThreads = threads.filter(thread => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    if (thread.title?.toLowerCase().includes(searchLower)) {
      return true
    }
    return thread.members.some(member => member.display_name?.toLowerCase().includes(searchLower));
  })

  // Start new thread
  const startThreadMutation = useMutation({
    mutationFn: async ({ memberIds, title }: { memberIds: string[], title?: string }) => {
      const res = await backend.messenger.start({ memberIds, title });
      return res.threadId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threads'] })
      toast({
        title: "Thread created",
        description: "Your new conversation has been started.",
      })
    },
    onError: (error) => {
      console.error('Failed to start thread:', error)
      toast({
        title: "Error",
        description: "Failed to start conversation. Please try again.",
        variant: "destructive",
      })
    },
  })

  // Add members to thread
  const addMembersMutation = useMutation({
    mutationFn: async ({ threadId, userIds }: { threadId: string, userIds: string[] }) => {
      await backend.messenger.addMembers({ threadId, userIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threads'] })
      toast({
        title: "Members added",
        description: "New members have been added to the conversation.",
      })
    },
    onError: (error) => {
      console.error('Failed to add members:', error)
      toast({
        title: "Error",
        description: "Failed to add members. Please try again.",
        variant: "destructive",
      })
    },
  })

  // Leave thread
  const leaveThreadMutation = useMutation({
    mutationFn: async (threadId: string) => {
      await backend.messenger.leave({ threadId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threads'] })
      toast({
        title: "Left conversation",
        description: "You have left the conversation.",
      })
    },
    onError: (error) => {
      console.error('Failed to leave thread:', error)
      toast({
        title: "Error",
        description: "Failed to leave conversation. Please try again.",
        variant: "destructive",
      })
    },
  })

  // Rename thread
  const renameThreadMutation = useMutation({
    mutationFn: async ({ threadId, title }: { threadId: string, title: string }) => {
      await backend.messenger.rename({ threadId, title });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threads'] })
      toast({
        title: "Thread renamed",
        description: "The conversation has been renamed.",
      })
    },
    onError: (error) => {
      console.error('Failed to rename thread:', error)
      toast({
        title: "Error",
        description: "Failed to rename conversation. Please try again.",
        variant: "destructive",
      })
    },
  })

  // Start Aura conversation
  const startAuraConversation = async () => {
    try {
      const threadId = await startThreadMutation.mutateAsync({
        memberIds: [AURA_BOT_ID],
        title: 'Aura - Sacred AI Assistant'
      })
      return threadId
    } catch (error) {
      console.error('Failed to start Aura conversation:', error)
      throw error
    }
  }

  // Real-time updates are now handled by the useChat hook's stream.
  // We can still invalidate the threads query to update unread counts etc.
  // This would require a more sophisticated real-time setup.
  // For now, we rely on refetching on window focus, which is a default behavior of react-query.

  return {
    threads: filteredThreads,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    startThread: startThreadMutation.mutateAsync,
    addMembers: addMembersMutation.mutateAsync,
    leaveThread: leaveThreadMutation.mutateAsync,
    renameThread: renameThreadMutation.mutateAsync,
    startAuraConversation,
    isStartingThread: startThreadMutation.isPending,
  }
}
