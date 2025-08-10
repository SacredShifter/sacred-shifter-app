import { useState } from 'react'
import { MessageCircle, X, Plus, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useMessages } from '../../hooks/useMessages'
import ChatView from './ChatView'
import { formatDistanceToNow } from 'date-fns'

export default function MessagesDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const { threads, currentThread, fetchMessages } = useMessages()

  const filteredThreads = threads.filter(thread => {
    if (!searchTerm) return true
    const otherMembers = thread.members.filter(m => m.user_id !== 'current-user-id')
    return otherMembers.some(member => 
      member.user.user_metadata?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full w-14 h-14 shadow-lg bg-purple-600 hover:bg-purple-700"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    )
  }

  if (currentThread) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-96 h-[600px]">
        <ChatView 
          threadId={currentThread}
          onBack={() => fetchMessages('')}
          onClose={() => setIsOpen(false)}
        />
      </div>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-96 h-[600px] shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg flex items-center">
          <MessageCircle className="w-5 h-5 mr-2" />
          Messages
        </CardTitle>
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="sm">
            <Plus className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col h-[520px] p-0">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredThreads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <MessageCircle className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations</h3>
              <p className="text-sm text-gray-600">
                Start a conversation with someone to see it here.
              </p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredThreads.map((thread) => {
                const otherMembers = thread.members.filter(m => m.user_id !== 'current-user-id')
                const displayName = thread.is_group 
                  ? thread.title || `Group (${thread.members.length})`
                  : otherMembers[0]?.user.user_metadata?.full_name || otherMembers[0]?.user.email.split('@')[0]
                
                const avatarSrc = !thread.is_group ? otherMembers[0]?.user.user_metadata?.avatar_url : undefined
                const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase()

                return (
                  <div
                    key={thread.id}
                    onClick={() => fetchMessages(thread.id)}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={avatarSrc} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      {thread.unread_count > 0 && (
                        <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500">
                          {thread.unread_count}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {displayName}
                        </p>
                        {thread.last_message && (
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(thread.last_message.created_at), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                      {thread.last_message && (
                        <p className="text-sm text-gray-600 truncate">
                          {thread.last_message.body || 'Media message'}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
