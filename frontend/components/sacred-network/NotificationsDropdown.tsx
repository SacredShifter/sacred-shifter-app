import { useEffect, useRef } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { X, Heart, MessageCircle, Users, Eye, Share, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import backend from '~backend/client'
import type { SocialNotification } from '~backend/social/types'

interface NotificationsDropdownProps {
  onClose: () => void
}

export default function NotificationsDropdown({ onClose }: NotificationsDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => backend.social.listNotifications({ limit: 20 }),
  })

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => backend.social.markNotificationAsRead({ notificationId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notification-counts'] })
    },
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: () => backend.social.markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notification-counts'] })
    },
  })

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return Heart
      case 'comment':
        return MessageCircle
      case 'follow':
        return Users
      case 'mention':
        return Eye
      case 'post_share':
        return Share
      default:
        return Eye
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'like':
        return 'text-red-500'
      case 'comment':
        return 'text-blue-500'
      case 'follow':
        return 'text-green-500'
      case 'mention':
        return 'text-purple-500'
      case 'post_share':
        return 'text-orange-500'
      default:
        return 'text-gray-500'
    }
  }

  const formatNotificationText = (notification: SocialNotification) => {
    const actorName = notification.actor?.display_name || notification.actor?.username || 'Someone'
    
    switch (notification.type) {
      case 'like':
        return `${actorName} resonated with your transmission`
      case 'comment':
        return `${actorName} reflected on your transmission`
      case 'follow':
        return `${actorName} started following your journey`
      case 'mention':
        return `${actorName} mentioned you in a transmission`
      case 'post_share':
        return `${actorName} shared your transmission`
      default:
        return 'New notification'
    }
  }

  const notifications = data?.notifications || []
  const unreadCount = data?.unread_count || 0

  return (
    <Card 
      ref={dropdownRef}
      className="absolute top-full right-0 mt-2 w-96 max-h-[500px] shadow-2xl z-50 bg-gradient-to-br from-purple-900/95 to-indigo-900/95 backdrop-blur-lg border-purple-500/30"
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-purple-500/20">
        <CardTitle className="text-lg text-purple-100">Sacred Notifications</CardTitle>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              className="text-xs text-purple-300 hover:text-white hover:bg-purple-800/50"
            >
              <Check className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="text-purple-300 hover:text-white hover:bg-purple-800/50"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="max-h-96">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-purple-400 mx-auto mb-2" />
              <p className="text-purple-300">No notifications yet</p>
              <p className="text-sm text-purple-400">Your sacred network activity will appear here</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type)
                const iconColor = getNotificationColor(notification.type)
                
                return (
                  <div
                    key={notification.id}
                    onClick={() => !notification.is_read && markAsReadMutation.mutate(notification.id)}
                    className={`flex items-start space-x-3 p-4 hover:bg-purple-800/30 cursor-pointer transition-colors ${
                      !notification.is_read ? 'bg-purple-800/20 border-l-2 border-purple-400' : ''
                    }`}
                  >
                    <Avatar className="w-10 h-10 ring-1 ring-purple-400/50">
                      <AvatarImage src={notification.actor?.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs">
                        {notification.actor?.display_name?.charAt(0) || 
                         notification.actor?.username?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-purple-100 leading-relaxed">
                            {formatNotificationText(notification)}
                          </p>
                          {notification.content && (
                            <p className="text-xs text-purple-300 mt-1 line-clamp-2">
                              "{notification.content}"
                            </p>
                          )}
                          <p className="text-xs text-purple-400 mt-1">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-2">
                          <Icon className={`w-4 h-4 ${iconColor}`} />
                          {!notification.is_read && (
                            <div className="w-2 h-2 rounded-full bg-purple-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
