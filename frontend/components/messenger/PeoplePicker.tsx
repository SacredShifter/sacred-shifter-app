import { useState } from 'react'
import { Search, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'

interface PeoplePickerProps {
  onStartThread: (memberIds: string[], title?: string) => void
  onCancel: () => void
  mode?: 'new-thread' | 'add-members'
}

// Mock users - in production, this would come from your user database
const mockUsers = [
  {
    id: 'user-1',
    email: 'quantum.mystic@sacred.com',
    user_metadata: {
      full_name: 'Quantum Mystic',
      avatar_url: undefined
    }
  },
  {
    id: 'user-2',
    email: 'dream.weaver@sacred.com',
    user_metadata: {
      full_name: 'Dream Weaver',
      avatar_url: undefined
    }
  },
  {
    id: 'user-3',
    email: 'light.worker@sacred.com',
    user_metadata: {
      full_name: 'Light Worker',
      avatar_url: undefined
    }
  },
  {
    id: 'user-4',
    email: 'frequency.healer@sacred.com',
    user_metadata: {
      full_name: 'Frequency Healer',
      avatar_url: undefined
    }
  }
]

export default function PeoplePicker({ onStartThread, onCancel, mode = 'new-thread' }: PeoplePickerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [groupTitle, setGroupTitle] = useState('')

  const filteredUsers = mockUsers.filter(user => {
    const searchLower = searchTerm.toLowerCase()
    return (
      user.user_metadata?.full_name?.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    )
  })

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleStart = () => {
    if (selectedUsers.length === 0) return
    
    const title = selectedUsers.length > 1 && groupTitle.trim() 
      ? groupTitle.trim() 
      : undefined
      
    onStartThread(selectedUsers, title)
  }

  const isGroup = selectedUsers.length > 1

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search people..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-gray-800 border-gray-700 text-gray-200"
        />
      </div>

      {isGroup && mode === 'new-thread' && (
        <Input
          placeholder="Group name (optional)"
          value={groupTitle}
          onChange={(e) => setGroupTitle(e.target.value)}
          className="bg-gray-800 border-gray-700 text-gray-200"
        />
      )}

      {selectedUsers.length > 0 && (
        <p className="text-sm text-gray-400">
          {selectedUsers.length} {selectedUsers.length === 1 ? 'person' : 'people'} selected
        </p>
      )}

      <div className="max-h-64 overflow-y-auto space-y-2">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            onClick={() => toggleUser(user.id)}
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-800 cursor-pointer"
          >
            <Checkbox
              checked={selectedUsers.includes(user.id)}
              onCheckedChange={() => toggleUser(user.id)}
            />
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback>
                {user.user_metadata?.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium text-sm text-gray-200">
                {user.user_metadata?.full_name || user.email.split('@')[0]}
              </p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            {selectedUsers.includes(user.id) && (
              <Check className="w-4 h-4 text-green-400" />
            )}
          </div>
        ))}
      </div>

      <div className="flex space-x-2">
        <Button
          onClick={handleStart}
          disabled={selectedUsers.length === 0}
          className="flex-1"
        >
          {mode === 'add-members' ? 'Add Members' : 'Start Conversation'}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
