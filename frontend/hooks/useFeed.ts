import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type Post = Database['public']['Tables']['posts']['Row'] & {
  author: {
    id: string
    email: string
    user_metadata: {
      full_name?: string
      avatar_url?: string
    }
  }
  circle?: {
    id: string
    name: string
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)

  const fetchPosts = async (offset = 0) => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('posts')
        .select(`
          *,
          author:auth.users!posts_author_id_fkey(id, email, user_metadata),
          circle:circles(id, name),
          reactions:post_reactions(kind, user_id),
          comments(count)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + 19)

      if (circleId) {
        query = query.eq('circle_id', circleId)
      }

      const { data, error } = await query

      if (error) throw error

      // Process reactions to get counts and user reactions
      const processedPosts = data?.map(post => {
        const reactionCounts: Record<string, number> = {}
        const userReactions = new Set<string>()
        const currentUserId = supabase.auth.getUser().then(u => u.data.user?.id)

        post.reactions?.forEach((reaction: any) => {
          reactionCounts[reaction.kind] = (reactionCounts[reaction.kind] || 0) + 1
          if (reaction.user_id === currentUserId) {
            userReactions.add(reaction.kind)
          }
        })

        const reactions = Object.entries(reactionCounts).map(([kind, count]) => ({
          kind,
          count,
          user_reacted: userReactions.has(kind)
        }))

        return {
          ...post,
          reactions,
          comment_count: post.comments?.[0]?.count || 0
        }
      }) || []

      if (offset === 0) {
        setPosts(processedPosts)
      } else {
        setPosts(prev => [...prev, ...processedPosts])
      }

      setHasMore(processedPosts.length === 20)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch posts')
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchPosts(posts.length)
    }
  }

  const createPost = async (data: {
    body: string
    visibility: string
    circle_id?: string
    media?: any[]
  }) => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('posts')
        .insert({
          author_id: user.user.id,
          body: data.body,
          visibility: data.visibility,
          circle_id: data.circle_id,
          media: data.media || []
        })

      if (error) throw error

      // Refresh feed
      fetchPosts()
    } catch (err) {
      throw err
    }
  }

  const toggleReaction = async (postId: string, kind: string) => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Not authenticated')

      // Check if reaction exists
      const { data: existing } = await supabase
        .from('post_reactions')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', user.user.id)
        .eq('kind', kind)
        .single()

      if (existing) {
        // Remove reaction
        await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.user.id)
          .eq('kind', kind)
      } else {
        // Add reaction
        await supabase
          .from('post_reactions')
          .insert({
            post_id: postId,
            user_id: user.user.id,
            kind
          })
      }

      // Update local state
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          const reactions = [...post.reactions]
          const reactionIndex = reactions.findIndex(r => r.kind === kind)
          
          if (existing) {
            if (reactionIndex >= 0) {
              reactions[reactionIndex].count--
              reactions[reactionIndex].user_reacted = false
              if (reactions[reactionIndex].count === 0) {
                reactions.splice(reactionIndex, 1)
              }
            }
          } else {
            if (reactionIndex >= 0) {
              reactions[reactionIndex].count++
              reactions[reactionIndex].user_reacted = true
            } else {
              reactions.push({ kind, count: 1, user_reacted: true })
            }
          }
          
          return { ...post, reactions }
        }
        return post
      }))
    } catch (err) {
      console.error('Failed to toggle reaction:', err)
    }
  }

  useEffect(() => {
    fetchPosts()

    // Set up real-time subscription
    const subscription = supabase
      .channel('posts')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'posts' },
        () => fetchPosts()
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [circleId])

  return {
    posts,
    loading,
    error,
    hasMore,
    loadMore,
    createPost,
    toggleReaction,
    refresh: () => fetchPosts()
  }
}
