import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ThreadList from './ThreadList'
import ChatView from './ChatView'
import ThreadDetails from './ThreadDetails'

interface MessengerDrawerProps {
  isOpen: boolean
  onClose: () => void
  initialThreadId?: string
}

export default function MessengerDrawer({ isOpen, onClose, initialThreadId }: MessengerDrawerProps) {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(initialThreadId || null)
  const [showDetails, setShowDetails] = useState(false)

  if (!isOpen) return null

  const handleSelectThread = (threadId: string) => {
    setSelectedThreadId(threadId)
    setShowDetails(false)
  }

  const handleShowDetails = () => {
    setShowDetails(true)
  }

  const handleCloseDetails = () => {
    setShowDetails(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900 rounded-2xl shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex overflow-hidden border border-purple-500/20">
        <div className="absolute top-4 right-4 z-10">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="w-80 flex-shrink-0">
          <ThreadList
            selectedThreadId={selectedThreadId}
            onSelectThread={handleSelectThread}
            onClose={onClose}
          />
        </div>

        <div className="flex-1 flex">
          {selectedThreadId ? (
            <>
              <div className={`flex-1 ${showDetails ? 'border-r border-purple-500/20' : ''}`}>
                <ChatView
                  threadId={selectedThreadId}
                  onShowDetails={handleShowDetails}
                />
              </div>
              
              {showDetails && (
                <ThreadDetails
                  threadId={selectedThreadId}
                  onClose={handleCloseDetails}
                />
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-900/50">
              <div className="text-center text-gray-400">
                <div className="w-16 h-16 bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💬</span>
                </div>
                <h3 className="text-lg font-medium text-gray-200 mb-2">
                  Select a conversation
                </h3>
                <p>
                  Choose a conversation from the list to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
