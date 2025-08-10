import { useState } from 'react'
import { Send, Image, Smile, Globe, Users, Lock, Eye } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '../../lib/supabase'

interface PostComposerProps {
  onSubmit: (data: {
    body: string
    visibility: string
    circle_id?: string
    media?: any[]
  }) => Promise<void>
  circleId?: string
}

export default function PostComposer({ onSubmit, circleId }: PostComposerProps) {
  const [body, setBody] = useState('')
  const [visibility, setVisibility] = useState(circleId ? 'circle' : 'public')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!body.trim()) {
      toast({
        title: "Error",
        description: "Please write something before posting.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      await onSubmit({
        body: body.trim(),
        visibility,
        circle_id: circleId,
        media: []
      })
      setBody('')
      toast({
        title: "Success",
        description: "Your post has been shared!",
      })
    } catch (error) {
      console.error('Failed to create post:', error)
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getVisibilityIcon = (vis: string) => {
    switch (vis) {
      case 'public': return Globe
      case 'followers': return Users
      case 'circle': return Users
      case 'private': return Lock
      default: return Globe
    }
  }

  const getVisibilityLabel = (vis: string) => {
    switch (vis) {
      case 'public': return 'Public'
      case 'followers': return 'Followers'
      case 'circle': return 'Circle'
      case 'private': return 'Private'
      default: return 'Public'
    }
  }

  const getVisibilityColor = (vis: string) => {
    switch (vis) {
      case 'public': return 'text-green-600 border-green-200'
      case 'followers': return 'text-blue-600 border-blue-200'
      case 'circle': return 'text-purple-600 border-purple-200'
      case 'private': return 'text-gray-600 border-gray-200'
      default: return 'text-green-600 border-green-200'
    }
  }

  return (
    <Card className="border-purple-200">
      <CardContent className="p-4">
        <div className="flex space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback>SS</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-3">
            <Textarea
              placeholder="What's on your mind?"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[80px] resize-none border-0 p-0 text-lg placeholder:text-gray-400 focus-visible:ring-0"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleSubmit()
                }
              }}
            />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                  <Image className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                  <Smile className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex items-center space-x-3">
                {!circleId && (
                  <Select value={visibility} onValueChange={setVisibility}>
                    <SelectTrigger className="w-auto border-0 p-0 h-auto">
                      <Badge variant="outline" className={getVisibilityColor(visibility)}>
                        {React.createElement(getVisibilityIcon(visibility), { className: "w-3 h-3 mr-1" })}
                        {getVisibilityLabel(visibility)}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center">
                          <Globe className="w-4 h-4 mr-2" />
                          Public
                        </div>
                      </SelectItem>
                      <SelectItem value="followers">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          Followers
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center">
                          <Lock className="w-4 h-4 mr-2" />
                          Private
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
                
                <Button
                  onClick={handleSubmit}
                  disabled={!body.trim() || isSubmitting}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
