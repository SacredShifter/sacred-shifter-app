import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Smile, MoreVertical, Reply, Edit, Trash, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useChat } from '../../hooks/useChat'
import { usePresence } from '../../hooks/usePresence'
import MessageInput from './MessageInput'
import AttachmentPreview from './AttachmentPreview'
import { formatDistanceToNow } from 'date-fns'
import { AURA_BOT_ID } from '../../config'

interface ChatViewProps {
  threadId: string
  onShowDetails: () => void
}

export default function ChatView({ threadId, onShowDetails }: ChatViewProps) {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { 
    messages, 
    members, 
    isLoading, 
    replyTo, 
    setReplyTo,
    sendMessage, 
    editMessage, 
    deleteMessage,
    getReadBy,
    isSending 
  } = useChat(threadId)
  
  const { typingMembers } = usePresence(threadId)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (body: string, content?: any) => {
    try {
      await sendMessage({ 
        body, 
        content, 
        replyToId: replyTo?.id 
      })
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleEditMessage = async (messageId: string) => {
    if (!editingText.trim()) return
    
    try {
      await editMessage({ messageId, body: editingText })
      setEditingMessageId(null)
      setEditingText('')
    } catch (error) {
      console.error('Failed to edit message:', error)
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (confirm('Are you sure you want to delete this message?')) {
      try {
        await deleteMessage(messageId)
      } catch (error) {
        console.error('Failed to delete message:', error)
      }
    }
  }

  const startEdit = (message: any) => {
    setEditingMessageId(message.id)
    setEditingText(message.body || '')
  }

  const cancelEdit = () => {
    setEditingMessageId(null)
    setEditingText('')
  }

  const getThreadTitle = () => {
    if (members.length === 0) return 'Loading...'
    
    // Check if this is an Aura conversation
    const hasAura = members.some(member => member.user_id === AURA_BOT_ID)
    if (hasAura) return 'Aura - Sacred AI Assistant'
    
    if (members.length === 2) {
      const otherMember = members.find(member => member.user_id !== 'current-user-id') // Replace with actual current user ID
      return otherMember?.user.user_metadata?.full_name || otherMember?.user.email?.split('@')[0] || 'Direct Message'
    }
    
    return `Group (${members.length} members)`
  }

  const groupMessagesByDate = (messages: any[]) => {
    const groups: { [key: string]: any[] } = {}
    
    messages.forEach(message => {
      const date = new Date(message.created_at).toDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(message)
    })
    
    return groups
  }

  const groupedMessages = groupMessagesByDate(messages)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback>
              {getThreadTitle().charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium text-gray-900">{getThreadTitle()}</h3>
            {typingMembers.length > 0 && (
              <p className="text-sm text-green-600">
                {typingMembers.map(m => m.display_name).join(', ')} {typingMembers.length === 1 ? 'is' : 'are'} typing...
              </p>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onShowDetails}>
          <Info className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(groupedMessages).map(([date, dayMessages]) => (
          <div key={date}>
            {/* Date divider */}
            <div className="flex items-center justify-center my-4">
              <div className="bg-gray-100 rounded-full px-3 py-1">
                <span className="text-xs text-gray-600">
                  {new Date(date).toLocaleDateString(undefined, { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </div>

            {/* Messages for this date */}
            {dayMessages.map((message, index) => {
              const isOwn = message.sender_id === 'current-user-id' // Replace with actual current user ID
              const showAvatar = index === 0 || dayMessages[index - 1].sender_id !== message.sender_id
              const isEditing = editingMessageId === message.id
              const readBy = getReadBy(message.created_at)

              return (
                <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
                  <div className={`flex space-x-2 max-w-[70%] ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {!isOwn && showAvatar && (
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={message.sender.user_metadata?.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {message.sender.user_metadata?.full_name?.charAt(0) || 
                           message.sender.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    {!isOwn && !showAvatar && <div className="w-8" />}

                    <div className={`space-y-1 ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                      {!isOwn && showAvatar && (
                        <p className="text-xs text-gray-500 px-3">
                          {message.sender.user_metadata?.full_name || message.sender.email?.split('@')[0]}
                        </p>
                      )}

                      {/* Reply preview */}
                      {message.reply_to && (
                        <div className={`text-xs p-2 rounded border-l-2 ${
                          isOwn ? 'border-purple-300 bg-purple-50' : 'border-gray-300 bg-gray-50'
                        }`}>
                          <p className="font-medium">
                            {message.reply_to.sender.user_metadata?.full_name || 'Someone'}
                          </p>
                          <p className="truncate">{message.reply_to.body}</p>
                        </div>
                      )}

                      <div className="group relative">
                        {isEditing ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="min-h-[60px] text-sm"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault()
                                  handleEditMessage(message.id)
                                } else if (e.key === 'Escape') {
                                  cancelEdit()
                                }
                              }}
                            />
                            <div className="flex space-x-2">
                              <Button size="sm" onClick={() => handleEditMessage(message.id)}>
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={cancelEdit}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div
                              className={`rounded-lg px-3 py-2 ${
                                isOwn
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                              {message.content?.attachments && message.content.attachments.length > 0 && (
                                <div className="mt-2 space-y-2">
                                  {message.content.attachments.map((attachment: any, idx: number) => (
                                    <AttachmentPreview key={idx} attachment={attachment} />
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Message actions */}
                            <div className={`absolute top-0 ${isOwn ? 'left-0' : 'right-0'} transform ${isOwn ? '-translate-x-full' : 'translate-x-full'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                              <div className="flex items-center space-x-1 bg-white border border-gray-200 rounded-lg shadow-sm p-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setReplyTo(message)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Reply className="w-3 h-3" />
                                </Button>
                                {isOwn && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => startEdit(message)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteMessage(message.id)}
                                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                    >
                                      <Trash className="w-3 h-3" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      <div className={`flex items-center space-x-2 text-xs text-gray-500 px-3 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <span>
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </span>
                        {message.edited_at && (
                          <span>(edited)</span>
                        )}
                        {isOwn && readBy.length > 0 && (
                          <span>• Seen by {readBy.length}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}

        {/* Typing indicator */}
        {typingMembers.length > 0 && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Reply className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                Replying to {replyTo.sender.user_metadata?.full_name || 'someone'}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setReplyTo(null)}>
              ×
            </Button>
          </div>
          <p className="text-sm text-gray-700 truncate mt-1">{replyTo.body}</p>
        </div>
      )}

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={isSending}
        threadId={threadId}
      />
    </div>
  )
}
