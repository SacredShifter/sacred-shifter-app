import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, AURA_BOT_ID, type ThreadWithUnread } from '../lib/supabase-messenger'
import { useToast } from '@/components/ui/use-toast'

export function useThreads() {
  const [searchTerm, setSearchTerm] = useState('')
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Fetch threads with unread counts
  const { data: threads = [], isLoading, error } = useQuery({
    queryKey: ['threads'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('api_get_threads_with_unread')
      if (error) throw error
      return data as ThreadWithUnread[]
    },
  })

  // Filter threads based on search
  const filteredThreads = threads.filter(thread => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    
    // Search by title
    if (thread.title?.toLowerCase().includes(searchLower)) {
      return true
    }
    
    // For 1:1 threads, we'd need to fetch member names
    // This is a simplified version
    return false
  })

  // Start new thread
  const startThreadMutation = useMutation({
    mutationFn: async ({ memberIds, title }: { memberIds: string[], title?: string }) => {
      const { data, error } = await supabase.rpc('api_start_thread', {
        p_member_ids: memberIds,
        p_title: title
      })
      if (error) throw error
      return data
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
      const { error } = await supabase.rpc('api_add_members', {
        p_thread_id: threadId,
        p_user_ids: userIds
      })
      if (error) throw error
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
      const { error } = await supabase.rpc('api_leave_thread', {
        p_thread_id: threadId
      })
      if (error) throw error
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
      const { error } = await supabase.rpc('api_rename_thread', {
        p_thread_id: threadId,
        p_title: title
      })
      if (error) throw error
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

  // Set up realtime subscription for thread updates
  useEffect(() => {
    const subscription = supabase
      .channel('threads-updates')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['threads'] })
        }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'threads' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['threads'] })
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'threads' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['threads'] })
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [queryClient])

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
