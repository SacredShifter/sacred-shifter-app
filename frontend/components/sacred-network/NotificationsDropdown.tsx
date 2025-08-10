import { useEffect, useRef } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { X, Heart, MessageCircle, Users, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useNotifications } from '../../hooks/useNotifications'

interface NotificationsDropdownProps {
  onClose: () => void
}

export default function NotificationsDropdown({ onClose }: NotificationsDropdownProps) {
  const { notifications, markAsRead, markAllAsRead } = useNotifications()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const getNotificationIcon = (kind: string) => {
    switch (kind) {
      case 'like':
      case 'reaction':
        return Heart
      case 'comment':
        return MessageCircle
      case 'follow':
        return Users
      case 'mention':
        return Eye
      default:
        return Eye
    }
  }

  const getNotificationColor = (kind: string) => {
    switch (kind) {
      case 'like':
      case 'reaction':
        return 'text-red-500'
      case 'comment':
        return 'text-blue-500'
      case 'follow':
        return 'text-green-500'
      case 'mention':
        return 'text-purple-500'
      default:
        return 'text-gray-500'
    }
  }

  const formatNotificationText = (notification: any) => {
    const ref = notification.ref
    switch (notification.kind) {
      case 'like':
        return `${ref.actor_name} liked your post`
      case 'comment':
        return `${ref.actor_name} commented on your post`
      case 'follow':
        return `${ref.actor_name} started following you`
      case 'mention':
        return `${ref.actor_name} mentioned you in a post`
      default:
        return 'New notification'
    }
  }

  return (
    <Card 
      ref={dropdownRef}
      className="absolute top-full right-0 mt-2 w-80 max-h-96 shadow-xl z-50"
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg">Notifications</CardTitle>
        <div className="flex items-center space-x-1">
          {notifications.some(n => !n.is_read) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              Mark all read
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.kind)
              const iconColor = getNotificationColor(notification.kind)
              
              return (
                <div
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className={`flex items-start space-x-3 p-3 hover:bg-gray-50 cursor-pointer ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  }`}
                >
                  <Icon className={`w-5 h-5 mt-0.5 ${iconColor}`} />
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      {formatNotificationText(notification)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  
                  {!notification.is_read && (
                    <Badge className="w-2 h-2 rounded-full p-0 bg-blue-500" />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
