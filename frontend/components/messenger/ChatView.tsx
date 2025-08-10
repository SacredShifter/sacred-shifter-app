import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Smile, MoreVertical, Reply, Edit, Trash, Info, Phone, Video, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useChat } from '../../hooks/useChat'
import { usePresence } from '../../hooks/usePresence'
import MessageInput from './MessageInput'
import AttachmentPreview from './AttachmentPreview'
import { formatDistanceToNow } from 'date-fns'
import { AURA_BOT_ID, defaultUser } from '../../config'
import { useCall } from '../../contexts/CallContext'

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
    thread,
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
  const { startCall } = useCall()

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
      setReplyTo(null)
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
    if (!thread) return 'Loading...'
    if (thread.title) return thread.title
    
    const hasAura = thread.members.some(member => member.user_id === AURA_BOT_ID)
    if (hasAura) return 'Aura - Sacred AI Assistant'
    
    if (thread.members.length === 2) {
      const otherMember = thread.members.find(member => member.user_id !== defaultUser.id)
      return otherMember?.display_name || 'Direct Message'
    }
    
    return `Group (${thread.members.length} members)`
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
  const otherMember = thread?.members.find(m => m.user_id !== defaultUser.id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-purple-900/30 text-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-purple-500/20 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10 ring-2 ring-purple-500/50">
            <AvatarFallback className="bg-purple-800">
              {getThreadTitle().charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium text-purple-100">{getThreadTitle()}</h3>
            {typingMembers.length > 0 && (
              <p className="text-sm text-green-400 animate-pulse">
                {typingMembers.map(m => m.display_name).join(', ')} {typingMembers.length === 1 ? 'is' : 'are'} typing...
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-1">
          {otherMember && (
            <>
              <Button variant="ghost" size="sm" onClick={() => startCall(otherMember.user_id, 'voice', threadId)}>
                <Phone className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => startCall(otherMember.user_id, 'video', threadId)}>
                <Video className="w-4 h-4" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" onClick={onShowDetails}>
            <Info className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {Object.entries(groupedMessages).map(([date, dayMessages]) => (
          <div key={date}>
            <div className="flex items-center justify-center my-4">
              <div className="bg-black/30 rounded-full px-3 py-1">
                <span className="text-xs text-purple-300">
                  {new Date(date).toLocaleDateString(undefined, { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </div>

            {dayMessages.map((message, index) => {
              const isOwn = message.sender_id === defaultUser.id
              const showAvatar = index === 0 || dayMessages[index - 1].sender_id !== message.sender_id
              const isEditing = editingMessageId === message.id
              const readBy = getReadBy(message.created_at.toString())

              return (
                <div key={message.id} className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  {!isOwn && (
                    <Avatar className={`w-8 h-8 self-end ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                      <AvatarImage src={message.sender.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-gradient-to-br from-purple-500 to-indigo-500 text-white">
                        {message.sender.display_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className={`flex flex-col space-y-1 max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                    {!isOwn && showAvatar && (
                      <p className="text-xs text-purple-300 px-3">
                        {message.sender.display_name}
                      </p>
                    )}

                    {message.reply_to && (
                      <div className={`text-xs p-2 rounded-lg border-l-2 max-w-full ${
                        isOwn ? 'border-purple-400 bg-purple-900/50' : 'border-gray-500 bg-gray-800/50'
                      }`}>
                        <p className="font-medium text-purple-300">
                          Replying to {message.reply_to.sender.display_name}
                        </p>
                        <p className="truncate text-gray-400">{message.reply_to.body}</p>
                      </div>
                    )}

                    <div className="group relative">
                      {isEditing ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="min-h-[60px] text-sm bg-gray-800 border-gray-700 text-gray-200"
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
                            <Button size="sm" onClick={() => handleEditMessage(message.id)}>Save</Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className={`rounded-xl px-4 py-2 ${isOwn ? 'bg-purple-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                            <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                            {message.content?.attachments && message.content.attachments.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {message.content.attachments.map((attachment: any, idx: number) => (
                                  <AttachmentPreview key={idx} attachment={attachment} />
                                ))}
                              </div>
                            )}
                          </div>
                          <div className={`absolute top-0 ${isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                            <div className="flex items-center space-x-1 bg-gray-800 border border-gray-700 rounded-lg shadow-sm p-1">
                              <Button variant="ghost" size="sm" onClick={() => setReplyTo(message)} className="h-6 w-6 p-0"><Reply className="w-3 h-3" /></Button>
                              {isOwn && (
                                <>
                                  <Button variant="ghost" size="sm" onClick={() => startEdit(message)} className="h-6 w-6 p-0"><Edit className="w-3 h-3" /></Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleDeleteMessage(message.id)} className="h-6 w-6 p-0 text-red-500 hover:text-red-700"><Trash className="w-3 h-3" /></Button>
                                </>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className={`flex items-center space-x-2 text-xs text-gray-400 px-3 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <span>{formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}</span>
                      {message.edited_at && <span>(edited)</span>}
                      {isOwn && readBy.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <Eye className="w-3 h-3" />
                          <span>Seen by {readBy.length}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {replyTo && (
        <div className="px-4 py-2 bg-black/30 border-t border-purple-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Reply className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300">Replying to {replyTo.sender.display_name}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setReplyTo(null)}>×</Button>
          </div>
          <p className="text-sm text-gray-400 truncate mt-1">{replyTo.body}</p>
        </div>
      )}

      <MessageInput onSendMessage={handleSendMessage} disabled={isSending} threadId={threadId} />
    </div>
  )
}
