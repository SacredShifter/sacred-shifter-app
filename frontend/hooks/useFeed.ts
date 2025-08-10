import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import backend from '~backend/client'
import { useToast } from '@/components/ui/use-toast'
import type { SocialPost } from '~backend/social/types'

export function useFeed(circleId?: string) {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [hasMore, setHasMore] = useState(true)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: postsData, isLoading: loading, error } = useQuery({
    queryKey: ['social-posts', circleId],
    queryFn: () => backend.social.listPosts({ circle_id: circleId }),
  })

  const createPostMutation = useMutation({
    mutationFn: async (data: {
      content: string
      visibility: 'public' | 'followers' | 'private'
      circle_id?: string
      media_urls?: any[]
    }) => {
      return backend.social.createPost(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-posts'] })
      toast({
        title: "✨ Sacred Transmission Sent",
        description: "Your wisdom has been shared with the network.",
      })
    },
    onError: (error) => {
      console.error('Failed to create post:', error)
      toast({
        title: "⚠️ Transmission Failed",
        description: "Unable to share your wisdom. Please try again.",
        variant: "destructive",
      })
    },
  })

  const toggleReactionMutation = useMutation({
    mutationFn: async (data: { postId: string; kind: string }) => {
      return backend.social.toggleReaction(data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['social-posts', circleId] })
    },
    onError: (error) => {
      console.error('Failed to toggle reaction:', error)
      toast({
        title: "⚠️ Resonance Failed",
        description: "Unable to register your resonance. Please try again.",
        variant: "destructive",
      })
    },
  })

  useEffect(() => {
    if (postsData?.posts) {
      setPosts(postsData.posts as any)
      // setHasMore(postsData.has_more) // has_more not implemented in backend yet
    }
  }, [postsData])

  const loadMore = () => {
    // Implement pagination if needed
  }

  const createPost = async (data: {
    content: string
    visibility: 'public' | 'followers' | 'private'
    circle_id?: string
    media?: any[]
  }) => {
    await createPostMutation.mutateAsync({
      ...data,
      media_urls: data.media
    })
  }

  const toggleReaction = async (postId: string, kind: string) => {
    await toggleReactionMutation.mutateAsync({ postId, kind })
  }

  return {
    posts,
    loading,
    error,
    hasMore,
    loadMore,
    createPost,
    toggleReaction,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['social-posts', circleId] })
  }
}
