import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/use-toast'
import backend from '~backend/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface CommentsProps {
  postId: string
}

export default function Comments({ postId }: CommentsProps) {
  const [newComment, setNewComment] = useState('')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data, isLoading: loading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => backend.social.listComments({ postId }),
  })
  const comments = data?.comments || []

  const createCommentMutation = useMutation({
    mutationFn: (content: string) => backend.social.createComment({ postId, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      queryClient.invalidateQueries({ queryKey: ['social-posts'] }) // to update comment_count
      setNewComment('')
    },
    onError: (error) => {
      console.error('Failed to create comment:', error)
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive",
      })
    },
  })

  const handleSubmit = async () => {
    if (!newComment.trim()) return
    createCommentMutation.mutate(newComment.trim())
  }

  // Real-time subscription is removed as it was using supabase channels.
  // This would require a websocket implementation on the backend, which is out of scope for now.
  // The query will refetch on window focus, which is a decent substitute for now.

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
        const authorName = comment.author.display_name || comment.author.username
        const authorInitials = authorName.split(' ').map(n => n[0]).join('').toUpperCase()

        return (
          <div key={comment.id} className="flex space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={comment.author.avatar_url || undefined} />
              <AvatarFallback className="text-xs">{authorInitials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="font-medium text-sm text-gray-900">{authorName}</p>
                <p className="text-sm text-gray-800">{comment.content}</p>
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
            disabled={!newComment.trim() || createCommentMutation.isPending}
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
