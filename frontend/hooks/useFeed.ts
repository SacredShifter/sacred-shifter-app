import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import backend from '~backend/client'
import type { SocialPost } from '~backend/social/posts'

export function useFeed(circleId?: string) {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [hasMore, setHasMore] = useState(true)
  const queryClient = useQueryClient()

  const { data: postsData, isLoading: loading, error } = useQuery({
    queryKey: ['social-posts', circleId],
    queryFn: () => backend.social.listPosts(circleId ? { circle_id: circleId } : {}),
  })

  const createPostMutation = useMutation({
    mutationFn: (data: {
      content: string
      visibility: string
      circle_id?: string
      media?: any[]
    }) => backend.social.createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-posts'] })
    },
  })

  const toggleReactionMutation = useMutation({
    mutationFn: (postId: string) => backend.social.toggleLike({ post_id: postId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-posts'] })
    },
  })

  useEffect(() => {
    if (postsData?.posts) {
      setPosts(postsData.posts)
      setHasMore(postsData.has_more)
    }
  }, [postsData])

  const loadMore = () => {
    // For now, we don't implement infinite scroll since the backend doesn't support pagination
    // This would be implemented when the backend supports offset/limit parameters
  }

  const createPost = async (data: {
    content: string
    visibility: string
    circle_id?: string
    media?: any[]
  }) => {
    await createPostMutation.mutateAsync(data)
  }

  const toggleReaction = async (postId: string, kind: string) => {
    await toggleReactionMutation.mutateAsync(postId)
  }

  return {
    posts,
    loading,
    error,
    hasMore,
    loadMore,
    createPost,
    toggleReaction,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['social-posts'] })
  }
}
