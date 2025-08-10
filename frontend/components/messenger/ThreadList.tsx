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
    if (thread.is_group) return `Group (${thread.members.length} members)`
    const otherMember = thread.members.find((m: any) => m.user_id !== '00000000-0000-0000-0000-000000000000');
    return otherMember?.display_name || 'Direct Message'
  }

  const getThreadAvatar = (thread: any) => {
    if (thread.title?.includes('Aura')) {
      return <Bot className="w-6 h-6 text-purple-400" />
    }
    if (thread.is_group) {
      return <Users className="w-6 h-6 text-gray-400" />
    }
    return <MessageCircle className="w-6 h-6 text-gray-400" />
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-black/20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-black/20 text-gray-200 border-r border-purple-500/20">
      <div className="p-4 border-b border-purple-500/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-purple-100">Messages</h2>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" onClick={handleStartAura} disabled={isStartingThread} className="text-purple-400 hover:text-purple-300"><Bot className="w-4 h-4" /></Button>
            <Dialog open={isNewThreadOpen} onOpenChange={setIsNewThreadOpen}>
              <DialogTrigger asChild><Button variant="ghost" size="sm"><Plus className="w-4 h-4" /></Button></DialogTrigger>
              <DialogContent className="bg-gray-900 border-purple-500/30 text-gray-200">
                <DialogHeader><DialogTitle>New Conversation</DialogTitle></DialogHeader>
                <PeoplePicker onStartThread={handleStartThread} onCancel={() => setIsNewThreadOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input placeholder="Search conversations..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-black/30 border-purple-500/30 text-purple-100 placeholder:text-purple-400 focus:border-purple-400" />
        </div>
      </div>

      <Tabs defaultValue="chats" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 bg-black/20 border-b border-purple-500/20">
          <TabsTrigger value="chats" className="data-[state=active]:bg-purple-800/50 data-[state=active]:text-white">Chats</TabsTrigger>
          <TabsTrigger value="calls" className="data-[state=active]:bg-purple-800/50 data-[state=active]:text-white">Calls</TabsTrigger>
        </TabsList>
        <TabsContent value="chats" className="flex-1 overflow-y-auto">
          {threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 text-gray-400">
              <MessageCircle className="w-12 h-12 mb-4" />
              <h3 className="text-lg font-medium text-gray-200 mb-2">No conversations</h3>
              <p className="text-sm mb-4">Start a conversation to see it here.</p>
              <Button onClick={() => setIsNewThreadOpen(true)}><Plus className="w-4 h-4 mr-2" />New Conversation</Button>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {threads.map((thread) => (
                <div key={thread.id} onClick={() => onSelectThread(thread.id)} className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedThreadId === thread.id ? 'bg-purple-800/50' : 'hover:bg-purple-800/30'}`}>
                  <div className="relative">
                    <Avatar className="w-12 h-12 ring-2 ring-purple-500/30"><AvatarFallback className="bg-gray-700">{getThreadAvatar(thread)}</AvatarFallback></Avatar>
                    {thread.unread_count > 0 && (<Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500">{thread.unread_count > 9 ? '9+' : thread.unread_count}</Badge>)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm text-purple-100 truncate">{getThreadTitle(thread)}</p>
                      {thread.last_message_created_at && (<p className="text-xs text-gray-400">{formatDistanceToNow(new Date(thread.last_message_created_at), { addSuffix: true })}</p>)}
                    </div>
                    {thread.last_message && (<p className="text-sm text-gray-300 truncate">{thread.last_message}</p>)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="calls" className="flex-1 overflow-y-auto"><CallHistoryList /></TabsContent>
      </Tabs>
    </div>
  )
}
