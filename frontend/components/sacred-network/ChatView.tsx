import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Send, X, Smile, Paperclip } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useMessages } from '../../hooks/useMessages'
import { formatDistanceToNow } from 'date-fns'

interface ChatViewProps {
  threadId: string
  onBack: () => void
  onClose: () => void
}

export default function ChatView({ threadId, onBack, onClose }: ChatViewProps) {
  const [newMessage, setNewMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { messages, sendMessage, threads } = useMessages()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const thread = threads.find(t => t.id === threadId)
  const otherMembers = thread?.members.filter(m => m.user_id !== 'current-user-id') || []
  const displayName = thread?.is_group 
    ? thread.title || `Group (${thread.members.length})`
    : otherMembers[0]?.user.user_metadata?.full_name || otherMembers[0]?.user.email.split('@')[0]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async () => {
    if (!newMessage.trim()) return

    try {
      setIsSubmitting(true)
      await sendMessage(threadId, newMessage.trim())
      setNewMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="h-full shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center space-x-2">
            {!thread?.is_group && (
              <Avatar className="w-8 h-8">
                <AvatarImage src={otherMembers[0]?.user.user_metadata?.avatar_url} />
                <AvatarFallback className="text-xs">
                  {displayName?.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              <p className="font-medium text-sm">{displayName}</p>
              {thread?.is_group && (
                <p className="text-xs text-gray-500">{thread.members.length} members</p>
              )}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="flex flex-col h-[460px] p-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => {
            const isOwn = message.sender_id === 'current-user-id' // Replace with actual user ID
            const senderName = message.sender.user_metadata?.full_name || message.sender.email.split('@')[0]
            const senderInitials = senderName.split(' ').map(n => n[0]).join('').toUpperCase()

            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex space-x-2 max-w-[80%] ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {!isOwn && (
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={message.sender.user_metadata?.avatar_url} />
                      <AvatarFallback className="text-xs">{senderInitials}</AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`space-y-1 ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                    {!isOwn && thread?.is_group && (
                      <p className="text-xs text-gray-500 px-3">{senderName}</p>
                    )}
                    
                    <div
                      className={`rounded-lg px-3 py-2 ${
                        isOwn
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {message.reply_to && (
                        <div className={`text-xs mb-2 p-2 rounded border-l-2 ${
                          isOwn ? 'border-purple-300 bg-purple-500' : 'border-gray-300 bg-gray-50'
                        }`}>
                          <p className="font-medium">
                            {message.reply_to.sender.user_metadata?.full_name || 'Someone'}
                          </p>
                          <p className="truncate">{message.reply_to.body}</p>
                        </div>
                      )}
                      
                      <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                    </div>
                    
                    <p className={`text-xs text-gray-500 px-3 ${isOwn ? 'text-right' : 'text-left'}`}>
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-4">
          <div className="flex space-x-2">
            <div className="flex-1 flex space-x-2">
              <Textarea
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="min-h-[36px] max-h-24 py-2 text-sm resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
              />
              <div className="flex flex-col space-y-1">
                <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
                  <Smile className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!newMessage.trim() || isSubmitting}
              size="sm"
              className="self-end bg-purple-600 hover:bg-purple-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
