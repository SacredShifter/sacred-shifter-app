import { useState } from 'react'
import { Users, Settings, UserPlus, UserMinus, Edit, LogOut, Image, Video, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useChat } from '../../hooks/useChat'
import { useThreads } from '../../hooks/useThreads'
import PeoplePicker from './PeoplePicker'
import { defaultUser } from '../../config'

interface ThreadDetailsProps {
  threadId: string
  onClose: () => void
}

export default function ThreadDetails({ threadId, onClose }: ThreadDetailsProps) {
  const [isRenaming, setIsRenaming] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [isAddMembersOpen, setIsAddMembersOpen] = useState(false)
  
  const { thread, messages } = useChat(threadId)
  const { renameThread, addMembers, leaveThread } = useThreads()

  const members = thread?.members || [];
  const currentMember = members.find(m => m.user_id === defaultUser.id)
  const canManage = currentMember?.role === 'owner' || currentMember?.role === 'admin'

  const handleRename = async () => {
    if (!newTitle.trim()) return
    
    try {
      await renameThread({ threadId, title: newTitle })
      setIsRenaming(false)
      setNewTitle('')
    } catch (error) {
      console.error('Failed to rename thread:', error)
    }
  }

  const handleAddMembers = async (memberIds: string[]) => {
    try {
      await addMembers({ threadId, userIds: memberIds })
      setIsAddMembersOpen(false)
    } catch (error) {
      console.error('Failed to add members:', error)
    }
  }

  const handleLeaveThread = async () => {
    if (confirm('Are you sure you want to leave this conversation?')) {
      try {
        await leaveThread(threadId)
        onClose()
      } catch (error) {
        console.error('Failed to leave thread:', error)
      }
    }
  }

  const mediaAttachments = messages
    .flatMap(msg => msg.content?.attachments || [])
    .filter(att => ['image', 'video'].includes(att.type))

  const fileAttachments = messages
    .flatMap(msg => msg.content?.attachments || [])
    .filter(att => att.type === 'file')

  return (
    <div className="w-80 bg-black/20 border-l border-purple-500/20 flex flex-col h-full text-gray-200">
      <div className="p-4 border-b border-purple-500/20 flex items-center justify-between">
        <h3 className="font-medium text-purple-100">Thread Details</h3>
        <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="members" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-black/20 border-b border-purple-500/20">
            <TabsTrigger value="members" className="data-[state=active]:bg-purple-800/50 data-[state=active]:text-white">Members</TabsTrigger>
            <TabsTrigger value="media" className="data-[state=active]:bg-purple-800/50 data-[state=active]:text-white">Media</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-purple-800/50 data-[state=active]:text-white">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="p-4 space-y-4">
            {canManage && (
              <Dialog open={isAddMembersOpen} onOpenChange={setIsAddMembersOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full"><UserPlus className="w-4 h-4 mr-2" />Add Members</Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-purple-500/30 text-gray-200">
                  <DialogHeader><DialogTitle>Add Members</DialogTitle></DialogHeader>
                  <PeoplePicker onStartThread={handleAddMembers} onCancel={() => setIsAddMembersOpen(false)} mode="add-members" />
                </DialogContent>
              </Dialog>
            )}

            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.user_id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10"><AvatarImage src={member.avatar_url || undefined} /><AvatarFallback>{member.display_name?.charAt(0)}</AvatarFallback></Avatar>
                    <div>
                      <p className="font-medium text-sm">{member.display_name}</p>
                      <p className="text-xs text-gray-400">{member.role}</p>
                    </div>
                  </div>
                  {canManage && member.user_id !== defaultUser.id && (
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700"><UserMinus className="w-3 h-3" /></Button>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="media" className="p-4 space-y-4">
            {mediaAttachments.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {mediaAttachments.map((attachment, index) => (
                  <div key={index} className="aspect-square bg-gray-800 rounded-lg overflow-hidden">
                    {attachment.type === 'image' ? (
                      <img src={attachment.url} alt="" className="w-full h-full object-cover cursor-pointer hover:opacity-80" onClick={() => window.open(attachment.url, '_blank')} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Video className="w-6 h-6 text-gray-400" /></div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400"><Image className="w-12 h-12 mx-auto mb-2" /><p className="text-sm">No media shared yet</p></div>
            )}

            {fileAttachments.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-purple-100">Files</h4>
                {fileAttachments.map((attachment, index) => (
                  <div key={index} className="flex items-center space-x-3 p-2 bg-gray-800 rounded-lg">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{attachment.meta.name}</p>
                      <p className="text-xs text-gray-500">{attachment.meta.size ? `${Math.round(attachment.meta.size / 1024)} KB` : ''}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => window.open(attachment.url, '_blank')}>Open</Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="p-4 space-y-4">
            {canManage && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-purple-100">Thread Name</label>
                {isRenaming ? (
                  <div className="flex space-x-2">
                    <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Enter thread name..." onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setIsRenaming(false); }} />
                    <Button size="sm" onClick={handleRename}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setIsRenaming(false)}>Cancel</Button>
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => setIsRenaming(true)} className="w-full justify-start"><Edit className="w-4 h-4 mr-2" />Rename Thread</Button>
                )}
              </div>
            )}
            <Button variant="outline" onClick={handleLeaveThread} className="w-full justify-start text-red-500 hover:text-red-400 hover:bg-red-900/20 border-red-500/50 hover:border-red-500"><LogOut className="w-4 h-4 mr-2" />Leave Conversation</Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
