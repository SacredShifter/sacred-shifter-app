import { useState } from 'react'
import { Search, Plus, MessageCircle, Users, Bot, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useThreads } from '../../hooks/useThreads'
import PeoplePicker from './PeoplePicker'
import CallHistoryList from './CallHistoryList'
import { formatDistanceToNow } from 'date-fns'

interface ThreadListProps {
  selectedThreadId: string | null
  onSelectThread: (threadId: string) => void
  onClose?: () => void
}

export default function ThreadList({ selectedThreadId, onSelectThread, onClose }: ThreadListProps) {
  const [isNewThreadOpen, setIsNewThreadOpen] = useState(false)
  const { 
    threads, 
    isLoading, 
    searchTerm, 
    setSearchTerm, 
    startThread, 
    startAuraConversation,
    isStartingThread 
  } = useThreads()

  const handleStartThread = async (memberIds: string[], title?: string) => {
    try {
      const threadId = await startThread({ memberIds, title })
      setIsNewThreadOpen(false)
      onSelectThread(threadId)
    } catch (error) {
      console.error('Failed to start thread:', error)
    }
  }

  const handleStartAura = async () => {
    try {
      const threadId = await startAuraConversation()
      onSelectThread(threadId)
    } catch (error) {
      console.error('Failed to start Aura conversation:', error)
    }
  }

  const getThreadTitle = (thread: any) => {
    if (thread.title) return thread.title
    if (thread.is_group) return `Group (${thread.member_count} members)`
    return 'Direct Message'
  }

  const getThreadAvatar = (thread: any) => {
    if (thread.title?.includes('Aura')) {
      return <Bot className="w-6 h-6 text-purple-600" />
    }
    if (thread.is_group) {
      return <Users className="w-6 h-6 text-gray-600" />
    }
    return <MessageCircle className="w-6 h-6 text-gray-600" />
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStartAura}
              disabled={isStartingThread}
              className="text-purple-600 hover:text-purple-700"
            >
              <Bot className="w-4 h-4" />
            </Button>
            <Dialog open={isNewThreadOpen} onOpenChange={setIsNewThreadOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Conversation</DialogTitle>
                </DialogHeader>
                <PeoplePicker
                  onStartThread={handleStartThread}
                  onCancel={() => setIsNewThreadOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search */}
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

      {/* Tabs */}
      <Tabs defaultValue="chats" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chats">Chats</TabsTrigger>
          <TabsTrigger value="calls">Calls</TabsTrigger>
        </TabsList>
        <TabsContent value="chats" className="flex-1 overflow-y-auto">
          {threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <MessageCircle className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations</h3>
              <p className="text-sm text-gray-600 mb-4">
                Start a conversation with someone to see it here.
              </p>
              <Button onClick={() => setIsNewThreadOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Conversation
              </Button>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {threads.map((thread) => (
                <div
                  key={thread.thread_id}
                  onClick={() => onSelectThread(thread.thread_id)}
                  className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedThreadId === thread.thread_id
                      ? 'bg-purple-50 border border-purple-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback>
                        {getThreadAvatar(thread)}
                      </AvatarFallback>
                    </Avatar>
                    {thread.unread_count > 0 && (
                      <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500">
                        {thread.unread_count > 99 ? '99+' : thread.unread_count}
                      </Badge>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {getThreadTitle(thread)}
                      </p>
                      {thread.last_message_created_at && (
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(thread.last_message_created_at), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                    {thread.last_message_body && (
                      <p className="text-sm text-gray-600 truncate">
                        {thread.last_message_body}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="calls" className="flex-1 overflow-y-auto">
          <CallHistoryList />
        </TabsContent>
      </Tabs>
    </div>
  )
}
