import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Heart, MessageCircle, Share, Eye, Zap, MoreHorizontal } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Comments from './Comments'
import type { SocialPost } from '~backend/social/types'

interface PostCardProps {
  post: SocialPost
  onReaction: (postId: string, kind: string) => void
}

export default function PostCard({ post, onReaction }: PostCardProps) {
  const [showComments, setShowComments] = useState(false)

  const getReactionIcon = (kind: string) => {
    switch (kind) {
      case 'like': return Heart
      case 'insight': return Eye
      case 'support': return Zap
      case 'vigil': return MoreHorizontal
      default: return Heart
    }
  }

  const getReactionColor = (kind: string, userReacted: boolean) => {
    if (!userReacted) return 'text-gray-500 hover:text-gray-700'
    
    switch (kind) {
      case 'like': return 'text-red-500 hover:text-red-600'
      case 'insight': return 'text-blue-500 hover:text-blue-600'
      case 'support': return 'text-green-500 hover:text-green-600'
      case 'vigil': return 'text-purple-500 hover:text-purple-600'
      default: return 'text-red-500 hover:text-red-600'
    }
  }

  const getVisibilityBadge = () => {
    switch (post.visibility) {
      case 'public':
        return <Badge variant="outline" className="text-green-600 border-green-200">Public</Badge>
      case 'followers':
        return <Badge variant="outline" className="text-blue-600 border-blue-200">Followers</Badge>
      case 'private':
        return <Badge variant="outline" className="text-gray-600 border-gray-200">Private</Badge>
      default:
        return null
    }
  }

  const authorName = post.author.display_name || post.author.username
  const authorInitials = authorName.split(' ').map(n => n[0]).join('').toUpperCase()

  return (
    <Card className="border-gray-200 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={post.author.avatar_url || undefined} />
              <AvatarFallback>{authorInitials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-gray-900">{authorName}</p>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                {getVisibilityBadge()}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {post.content && (
          <div className="prose max-w-none">
            <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
          </div>
        )}

        {/* Media gallery */}
        {post.media_urls && post.media_urls.length > 0 && (
          <div className="grid grid-cols-2 gap-2 rounded-lg overflow-hidden">
            {post.media_urls.map((url, index) => (
              <div key={index} className="aspect-square bg-gray-100 rounded-lg">
                <img 
                  src={url} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Reaction bar */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-1">
            {['like', 'insight', 'support', 'vigil'].map((kind) => {
              const reaction = post.reactions.find(r => r.kind === kind)
              const Icon = getReactionIcon(kind)
              
              return (
                <Button
                  key={kind}
                  variant="ghost"
                  size="sm"
                  onClick={() => onReaction(post.id, kind)}
                  className={`${getReactionColor(kind, reaction?.user_reacted || false)} px-2`}
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
              className="text-gray-500 hover:text-gray-700"
            >
              <MessageCircle className="w-4 h-4" />
              {post.comment_count > 0 && (
                <span className="ml-1 text-xs">{post.comment_count}</span>
              )}
            </Button>
            
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
              <Share className="w-4 h-4" />
            </Button>
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
