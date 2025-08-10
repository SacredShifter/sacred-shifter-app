import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import backend from '~backend/client'
import type { SocialMessage } from '~backend/social/messages'

export function useMessages() {
  const queryClient = useQueryClient()

  const { data: messagesData, isLoading: loading, error } = useQuery({
    queryKey: ['social-messages'],
    queryFn: () => backend.social.listMessages(),
  })

  const sendMessageMutation = useMutation({
    mutationFn: (data: {
      recipient_id: string
      content: string
    }) => backend.social.sendMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-messages'] })
    },
  })

  const messages = messagesData?.messages || []

  const sendMessage = async (recipient_id: string, content: string) => {
    await sendMessageMutation.mutateAsync({ recipient_id, content })
  }

  return {
    messages,
    loading,
    error,
    sendMessage,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['social-messages'] })
  }
}
