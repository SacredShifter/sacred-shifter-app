import { useQuery } from '@tanstack/react-query'
import { Phone, Video, PhoneIncoming, PhoneMissed, PhoneOff, Download } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import backend from '~backend/client'
import { formatDistanceToNow } from 'date-fns'

export default function CallHistoryList() {
  const { data, isLoading } = useQuery({
    queryKey: ['call-history'],
    queryFn: () => backend.messenger.listCallHistory(),
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'answered':
        return <PhoneIncoming className="w-4 h-4 text-green-600" />
      case 'missed':
        return <PhoneMissed className="w-4 h-4 text-red-600" />
      case 'declined':
        return <PhoneOff className="w-4 h-4 text-yellow-600" />
      default:
        return <Phone className="w-4 h-4 text-gray-500" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!data || data.calls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <PhoneOff className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Call History</h3>
        <p className="text-sm text-gray-600">Your recent calls will appear here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-1 p-2">
      {data.calls.map((call) => (
        <div
          key={call.id}
          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
        >
          <Avatar className="w-12 h-12">
            <AvatarFallback>
              {call.type === 'video' ? <Video /> : <Phone />}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-gray-900 truncate">
              {/* In a real app, you'd resolve the other user's name */}
              Call with User
            </p>
            <div className="flex items-center space-x-2">
              {getStatusIcon(call.status)}
              <p className="text-sm text-gray-600 capitalize">{call.status}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(call.created_at), { addSuffix: true })}
            </p>
            {call.duration_seconds && (
              <Badge variant="outline" className="mt-1">
                {Math.floor(call.duration_seconds / 60)}m {call.duration_seconds % 60}s
              </Badge>
            )}
            {call.recording_url && (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="mt-1"
              >
                <a href={call.recording_url} target="_blank" rel="noopener noreferrer">
                  <Download className="w-3 h-3 mr-1" />
                  Recording
                </a>
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
