import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Send, Reply, Heart, MoreHorizontal, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/use-toast'
import backend from '~backend/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { SocialComment } from '~backend/social/types'

interface CommentsProps {
  postId: string
}

interface CommentItemProps {
  comment: SocialComment
  onReply: (commentId: string) => void
  replyingTo: string | null
  onCancelReply: () => void
  depth?: number
}

function CommentItem({ comment, onReply, replyingTo, onCancelReply, depth = 0 }: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(depth < 2) // Auto-expand first 2 levels
  const [newReply, setNewReply] = useState('')
  const [isLiked, setIsLiked] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const createReplyMutation = useMutation({
    mutationFn: (content: string) => backend.social.createComment({ 
      postId: comment.post_id, 
      content,
      parentId: comment.id,
      depth: depth + 1
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', comment.post_id] })
      setNewReply('')
      onCancelReply()
      toast({
        title: "✨ Reply Sent",
        description: "Your reply has been added to the conversation.",
      })
    },
    onError: (error) => {
      console.error('Failed to create reply:', error)
      toast({
        title: "⚠️ Reply Failed",
        description: "Failed to post reply. Please try again.",
        variant: "destructive",
      })
    },
  })

  const handleSubmitReply = async () => {
    if (!newReply.trim()) return
    createReplyMutation.mutate(newReply.trim())
  }

  const handleLike = () => {
    setIsLiked(!isLiked)
    // In a real app, this would call an API to like the comment
  }

  const authorName = comment.author.display_name || comment.author.username
  const authorInitials = authorName.split(' ').map(n => n[0]).join('').toUpperCase()
  const isReplying = replyingTo === comment.id

  return (
    <div className={`space-y-3 ${depth > 0 ? 'ml-8 pl-4 border-l-2 border-purple-200' : ''}`}>
      <div className="flex space-x-3">
        <Avatar className="w-8 h-8 ring-1 ring-purple-200">
          <AvatarImage src={comment.author.avatar_url || undefined} />
          <AvatarFallback className="text-xs bg-gradient-to-r from-purple-400 to-indigo-400 text-white">
            {authorInitials}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-2">
          <div className="bg-gray-50 rounded-lg px-3 py-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <p className="font-medium text-sm text-gray-900">{authorName}</p>
                {comment.author.is_verified && (
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                    ✓ Verified
                  </Badge>
                )}
                {comment.author.experience_level && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {comment.author.experience_level}
                  </Badge>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Report</DropdownMenuItem>
                  <DropdownMenuItem>Share</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{comment.content}</p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`h-6 px-2 text-xs ${isLiked ? 'text-red-600' : 'text-gray-500'}`}
              >
                <Heart className={`w-3 h-3 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                {comment.like_count + (isLiked ? 1 : 0)}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReply(comment.id)}
                className="h-6 px-2 text-xs text-gray-500 hover:text-purple-600"
              >
                <Reply className="w-3 h-3 mr-1" />
                Reply
              </Button>
            </div>
            
            {comment.replies && comment.replies.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplies(!showReplies)}
                className="h-6 px-2 text-xs text-purple-600"
              >
                {showReplies ? (
                  <>
                    <ChevronUp className="w-3 h-3 mr-1" />
                    Hide {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3 mr-1" />
                    Show {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Reply Input */}
          {isReplying && (
            <div className="space-y-2">
              <Textarea
                placeholder={`Reply to ${authorName}...`}
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                className="min-h-[60px] text-sm resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmitReply()
                  } else if (e.key === 'Escape') {
                    onCancelReply()
                  }
                }}
              />
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={handleSubmitReply}
                  disabled={!newReply.trim() || createReplyMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Send className="w-3 h-3 mr-1" />
                  {createReplyMutation.isPending ? 'Sending...' : 'Reply'}
                </Button>
                <Button size="sm" variant="outline" onClick={onCancelReply}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Nested Replies */}
          {showReplies && comment.replies && comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              replyingTo={replyingTo}
              onCancelReply={onCancelReply}
              depth={depth + 1}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Comments({ postId }: CommentsProps) {
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
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
      queryClient.invalidateQueries({ queryKey: ['social-posts'] })
      setNewComment('')
      toast({
        title: "✨ Comment Added",
        description: "Your wisdom has been shared.",
      })
    },
    onError: (error) => {
      console.error('Failed to create comment:', error)
      toast({
        title: "⚠️ Comment Failed",
        description: "Failed to post comment. Please try again.",
        variant: "destructive",
      })
    },
  })

  const handleSubmit = async () => {
    if (!newComment.trim()) return
    createCommentMutation.mutate(newComment.trim())
  }

  const handleReply = (commentId: string) => {
    setReplyingTo(replyingTo === commentId ? null : commentId)
  }

  const handleCancelReply = () => {
    setReplyingTo(null)
  }

  // Group comments by thread (top-level comments with their replies)
  const threadedComments = comments.filter(comment => comment.depth === 0 || !comment.parent_id)
  
  // Add replies to their parent comments
  const commentsWithReplies = threadedComments.map(comment => ({
    ...comment,
    replies: comments.filter(reply => reply.parent_id === comment.id)
  }))

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
    <div className="space-y-4 pt-4 border-t border-gray-100">
      {/* Comments List */}
      {commentsWithReplies.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onReply={handleReply}
          replyingTo={replyingTo}
          onCancelReply={handleCancelReply}
        />
      ))}

      {/* New Comment Input */}
      <div className="flex space-x-3 pt-4 border-t border-gray-100">
        <Avatar className="w-8 h-8 ring-1 ring-purple-200">
          <AvatarFallback className="text-xs bg-gradient-to-r from-purple-400 to-indigo-400 text-white">
            SS
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder="Share your thoughts on this transmission..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[60px] text-sm resize-none border-purple-200 focus:border-purple-400"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={!newComment.trim() || createCommentMutation.isPending}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Send className="w-3 h-3 mr-1" />
              {createCommentMutation.isPending ? 'Sending...' : 'Comment'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
