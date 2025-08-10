import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '../../lib/supabase'

interface Comment {
  id: string
  body: string
  created_at: string
  author: {
    id: string
    email: string
    user_metadata: {
      full_name?: string
      avatar_url?: string
    }
  }
}

interface CommentsProps {
  postId: string
}

export default function Comments({ postId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          author:auth.users!comments_author_id_fkey(id, email, user_metadata)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) throw error

      setComments(data || [])
    } catch (err) {
      console.error('Failed to fetch comments:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!newComment.trim()) return

    try {
      setIsSubmitting(true)
      
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          author_id: user.user.id,
          body: newComment.trim()
        })

      if (error) throw error

      setNewComment('')
      fetchComments()
    } catch (error) {
      console.error('Failed to create comment:', error)
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    fetchComments()

    // Set up real-time subscription
    const subscription = supabase
      .channel(`comments-${postId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'comments',
          filter: `post_id=eq.${postId}`
        },
        () => fetchComments()
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [postId])

  if (loading) {
    return (
      <div className="space-y-3 pt-3 border-t border-gray-100">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 pt-3 border-t border-gray-100">
      {/* Existing comments */}
      {comments.map((comment) => {
        const authorName = comment.author.user_metadata?.full_name || comment.author.email.split('@')[0]
        const authorInitials = authorName.split(' ').map(n => n[0]).join('').toUpperCase()

        return (
          <div key={comment.id} className="flex space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={comment.author.user_metadata?.avatar_url} />
              <AvatarFallback className="text-xs">{authorInitials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="font-medium text-sm text-gray-900">{authorName}</p>
                <p className="text-sm text-gray-800">{comment.body}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-3">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        )
      })}

      {/* New comment input */}
      <div className="flex space-x-3">
        <Avatar className="w-8 h-8">
          <AvatarFallback className="text-xs">SS</AvatarFallback>
        </Avatar>
        <div className="flex-1 flex space-x-2">
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[36px] py-2 text-sm resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
          />
          <Button
            onClick={handleSubmit}
            disabled={!newComment.trim() || isSubmitting}
            size="sm"
            className="self-end"
          >
            <Send className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}
