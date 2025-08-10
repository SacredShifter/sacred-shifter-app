import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { defaultUser } from '../config'
import { useToast } from '@/components/ui/use-toast'

interface Post {
  id: string
  author_id: string
  circle_id?: string
  body: string
  content: any
  visibility: string
  media: any[]
  created_at: string
  updated_at: string
  author: {
    id: string
    email: string
    user_metadata: {
      full_name?: string
      avatar_url?: string
    }
  }
  reactions: Array<{
    kind: string
    count: number
    user_reacted: boolean
  }>
  comment_count: number
}

export function useFeed(circleId?: string) {
  const [posts, setPosts] = useState<Post[]>([])
  const [hasMore, setHasMore] = useState(true)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: postsData, isLoading: loading, error } = useQuery({
    queryKey: ['social-posts', circleId],
    queryFn: async () => {
      let query = supabase
        .from('posts')
        .select(`
          *,
          author:auth.users!posts_author_id_fkey(id, email, user_metadata)
        `)
        .order('created_at', { ascending: false })

      if (circleId) {
        query = query.eq('circle_id', circleId)
      }

      const { data, error } = await query

      if (error) throw error

      // Transform data to include reactions and comment counts
      const transformedPosts = await Promise.all(
        (data || []).map(async (post) => {
          // Get reactions
          const { data: reactions } = await supabase
            .from('post_reactions')
            .select('kind, user_id')
            .eq('post_id', post.id)

          // Get comment count
          const { count: commentCount } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id)

          // Group reactions by kind
          const reactionGroups: Record<string, { count: number; user_reacted: boolean }> = {}
          
          reactions?.forEach(reaction => {
            if (!reactionGroups[reaction.kind]) {
              reactionGroups[reaction.kind] = { count: 0, user_reacted: false }
            }
            reactionGroups[reaction.kind].count++
            if (reaction.user_id === defaultUser.id) {
              reactionGroups[reaction.kind].user_reacted = true
            }
          })

          return {
            ...post,
            reactions: Object.entries(reactionGroups).map(([kind, data]) => ({
              kind,
              ...data
            })),
            comment_count: commentCount || 0
          }
        })
      )

      return { posts: transformedPosts, has_more: false, total: transformedPosts.length }
    },
  })

  const createPostMutation = useMutation({
    mutationFn: async (data: {
      content: string
      visibility: string
      circle_id?: string
      media?: any[]
    }) => {
      const { data: post, error } = await supabase
        .from('posts')
        .insert({
          author_id: defaultUser.id,
          body: data.content,
          content: { body: data.content },
          visibility: data.visibility,
          circle_id: data.circle_id,
          media: data.media || []
        })
        .select()
        .single()

      if (error) throw error
      return post
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
      // Check if reaction exists
      const { data: existingReaction } = await supabase
        .from('post_reactions')
        .select('*')
        .eq('post_id', data.postId)
        .eq('user_id', defaultUser.id)
        .eq('kind', data.kind)
        .single()

      if (existingReaction) {
        // Remove reaction
        const { error } = await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', data.postId)
          .eq('user_id', defaultUser.id)
          .eq('kind', data.kind)

        if (error) throw error
      } else {
        // Add reaction
        const { error } = await supabase
          .from('post_reactions')
          .insert({
            post_id: data.postId,
            user_id: defaultUser.id,
            kind: data.kind
          })

        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-posts'] })
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
      setPosts(postsData.posts)
      setHasMore(postsData.has_more)
    }
  }, [postsData])

  const loadMore = () => {
    // Implement pagination if needed
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
    refresh: () => queryClient.invalidateQueries({ queryKey: ['social-posts'] })
  }
}
