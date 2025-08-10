import { Phone, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCall } from '../../contexts/CallContext'

export default function IncomingCallToast() {
  const { incomingCall, answerCall, declineCall } = useCall()

  if (!incomingCall) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-4 border border-purple-200">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            {incomingCall.type === 'video' ? (
              <Video className="w-6 h-6 text-purple-600" />
            ) : (
              <Phone className="w-6 h-6 text-purple-600" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium">Incoming {incomingCall.type} call</p>
            <p className="text-sm text-gray-500">
              {/* In a real app, you'd resolve the caller's name */}
              From Caller Name
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={declineCall}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Decline
            </Button>
            <Button
              size="sm"
              onClick={answerCall}
              className="bg-green-600 hover:bg-green-700"
            >
              Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
