import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Heart, MessageCircle, Share, Eye, Zap, MoreHorizontal, Star, Pin, Globe, Users, Lock } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import backend from '~backend/client'
import Comments from './Comments'
import type { SocialPost } from '~backend/social/types'

interface PostCardProps {
  post: SocialPost
  onReaction: (postId: string, kind: string) => void
}

export default function PostCard({ post, onReaction }: PostCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [shareContent, setShareContent] = useState('')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const sharePostMutation = useMutation({
    mutationFn: (content?: string) => backend.social.sharePost({ postId: post.id, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-posts'] })
      setIsShareDialogOpen(false)
      setShareContent('')
      toast({
        title: "✨ Transmission Shared",
        description: "You've amplified this sacred wisdom.",
      })
    },
    onError: (error) => {
      console.error('Failed to share post:', error)
      toast({
        title: "⚠️ Share Failed",
        description: "Failed to share transmission. Please try again.",
        variant: "destructive",
      })
    },
  })

  const getReactionIcon = (kind: string) => {
    switch (kind) {
      case 'like': return Heart
      case 'insight': return Eye
      case 'support': return Zap
      case 'sacred': return Star
      default: return Heart
    }
  }

  const getReactionColor = (kind: string, userReacted: boolean) => {
    if (!userReacted) return 'text-gray-500 hover:text-gray-700'
    
    switch (kind) {
      case 'like': return 'text-red-500 hover:text-red-600'
      case 'insight': return 'text-blue-500 hover:text-blue-600'
      case 'support': return 'text-green-500 hover:text-green-600'
      case 'sacred': return 'text-purple-500 hover:text-purple-600'
      default: return 'text-red-500 hover:text-red-600'
    }
  }

  const getReactionLabel = (kind: string) => {
    switch (kind) {
      case 'like': return 'Resonate'
      case 'insight': return 'Insight'
      case 'support': return 'Support'
      case 'sacred': return 'Sacred'
      default: return 'React'
    }
  }

  const getVisibilityIcon = () => {
    switch (post.visibility) {
      case 'public':
        return <Globe className="w-3 h-3 text-green-500" />
      case 'followers':
        return <Users className="w-3 h-3 text-blue-500" />
      case 'private':
        return <Lock className="w-3 h-3 text-gray-500" />
      default:
        return null
    }
  }

  const getVisibilityLabel = () => {
    switch (post.visibility) {
      case 'public': return 'Public'
      case 'followers': return 'Resonators'
      case 'private': return 'Private'
      default: return ''
    }
  }

  const handleShare = () => {
    sharePostMutation.mutate(shareContent.trim() || undefined)
  }

  const authorName = post.author.display_name || post.author.username
  const authorInitials = authorName.split(' ').map(n => n[0]).join('').toUpperCase()

  return (
    <Card className="bg-black/30 backdrop-blur-lg border-purple-500/30 hover:border-purple-400/50 transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12 ring-2 ring-purple-400/50">
              <AvatarImage src={post.author.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                {authorInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <p className="font-medium text-purple-100">{authorName}</p>
                {post.author.is_verified && (
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                    ✓
                  </Badge>
                )}
                {post.author.experience_level && (
                  <Badge variant="outline" className="text-xs border-purple-400 text-purple-300 capitalize">
                    {post.author.experience_level}
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2 text-sm text-purple-300">
                <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  {getVisibilityIcon()}
                  <span className="text-xs">{getVisibilityLabel()}</span>
                </div>
                {post.is_pinned && (
                  <>
                    <span>•</span>
                    <Pin className="w-3 h-3 text-yellow-500" />
                  </>
                )}
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-purple-300 hover:text-white hover:bg-purple-800/50">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-purple-900 border-purple-500/30">
              <DropdownMenuItem className="text-purple-100">Save Transmission</DropdownMenuItem>
              <DropdownMenuItem className="text-purple-100">Copy Link</DropdownMenuItem>
              <DropdownMenuItem className="text-purple-100">Report</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Post Content */}
        <div className="prose max-w-none">
          <p className="text-purple-100 whitespace-pre-wrap leading-relaxed">{post.content}</p>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs border-purple-400 text-purple-300">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Location and Feeling */}
        {(post.location || post.feeling) && (
          <div className="flex items-center space-x-4 text-sm text-purple-400">
            {post.location && (
              <span>📍 {post.location}</span>
            )}
            {post.feeling && (
              <span>✨ feeling {post.feeling}</span>
            )}
          </div>
        )}

        {/* Media gallery */}
        {post.media_urls && post.media_urls.length > 0 && (
          <div className="grid grid-cols-2 gap-2 rounded-lg overflow-hidden">
            {post.media_urls.map((url, index) => (
              <div key={index} className="aspect-square bg-purple-900/30 rounded-lg">
                <img 
                  src={url} 
                  alt="" 
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            ))}
          </div>
        )}

        {/* Reaction bar */}
        <div className="flex items-center justify-between pt-2 border-t border-purple-500/20">
          <div className="flex items-center space-x-1">
            {['like', 'insight', 'support', 'sacred'].map((kind) => {
              const reaction = post.reactions.find(r => r.kind === kind)
              const Icon = getReactionIcon(kind)
              
              return (
                <Button
                  key={kind}
                  variant="ghost"
                  size="sm"
                  onClick={() => onReaction(post.id, kind)}
                  className={`${getReactionColor(kind, reaction?.user_reacted || false)} px-2 hover:bg-purple-800/30`}
                  title={getReactionLabel(kind)}
                >
                  <Icon className="w-4 h-4" />
                  {reaction && reaction.count > 0 && (
                    <span className="ml-1 text-xs">{reaction.count}</span>
                  )}
                </Button>
              )
            })}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="text-purple-300 hover:text-white hover:bg-purple-800/30"
            >
              <MessageCircle className="w-4 h-4" />
              {post.comment_count > 0 && (
                <span className="ml-1 text-xs">{post.comment_count}</span>
              )}
            </Button>
            
            <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-purple-300 hover:text-white hover:bg-purple-800/30">
                  <Share className="w-4 h-4" />
                  {post.share_count > 0 && (
                    <span className="ml-1 text-xs">{post.share_count}</span>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gradient-to-br from-purple-900 to-indigo-900 border-purple-500/30">
                <DialogHeader>
                  <DialogTitle className="text-purple-100">Share Sacred Transmission</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-purple-800/30 rounded-lg p-3 border border-purple-500/30">
                    <p className="text-sm text-purple-200 line-clamp-3">{post.content}</p>
                    <p className="text-xs text-purple-400 mt-2">by {authorName}</p>
                  </div>
                  <Textarea
                    placeholder="Add your reflection on this transmission (optional)..."
                    value={shareContent}
                    onChange={(e) => setShareContent(e.target.value)}
                    rows={3}
                    className="bg-black/30 border-purple-500/30 text-purple-100 placeholder:text-purple-400"
                  />
                  <Button
                    onClick={handleShare}
                    disabled={sharePostMutation.isPending}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  >
                    {sharePostMutation.isPending ? 'Sharing...' : '✨ Share Transmission'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Comments */}
        {showComments && (
          <Comments postId={post.id} />
        )}
      </CardContent>
    </Card>
  )
}
