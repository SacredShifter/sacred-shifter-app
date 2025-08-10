import { useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import backend from '~backend/client'
import NotificationsDropdown from './NotificationsDropdown'

export default function NotificationsBell() {
  const [isOpen, setIsOpen] = useState(false)

  const { data: counts } = useQuery({
    queryKey: ['notification-counts'],
    queryFn: () => backend.social.getNotificationCounts(),
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  const unreadCount = counts?.unread || 0

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-purple-200 hover:text-white hover:bg-purple-800/50"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 border-2 border-purple-900">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <NotificationsDropdown onClose={() => setIsOpen(false)} />
      )}
    </div>
  )
}
