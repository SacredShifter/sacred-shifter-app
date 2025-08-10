import { useEffect, useRef } from 'react'
import { useFeed } from '../../hooks/useFeed'
import PostComposer from './PostComposer'
import PostCard from './PostCard'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface FeedProps {
  circleId?: string
}

export default function Feed({ circleId }: FeedProps) {
  const { posts, loading, hasMore, loadMore, createPost, toggleReaction } = useFeed(circleId)
  const observerRef = useRef<HTMLDivElement>(null)

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loading, loadMore])

  return (
    <div className="space-y-6">
      <PostComposer onSubmit={createPost} circleId={circleId} />
      
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard 
            key={post.id} 
            post={post} 
            onReaction={toggleReaction}
          />
        ))}
        
        {loading && (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              <span className="ml-2 text-gray-600">Loading posts...</span>
            </CardContent>
          </Card>
        )}
        
        {!loading && posts.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">No posts yet. Be the first to share something!</p>
            </CardContent>
          </Card>
        )}
        
        <div ref={observerRef} className="h-4" />
      </div>
    </div>
  )
}
