import { useState, useRef } from 'react'
import { Send, Paperclip, Smile } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { usePresence } from '../../hooks/usePresence'
import { uploadFile } from '../../lib/files'
import type { MessageContent } from '~backend/messenger/types'
import VigilPicker from './VigilPicker'

interface MessageInputProps {
  onSendMessage: (body: string, content?: MessageContent) => Promise<void>
  disabled?: boolean
  threadId: string
}

export default function MessageInput({ onSendMessage, disabled, threadId }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<any[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [showVigilPicker, setShowVigilPicker] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { setTyping } = usePresence(threadId)

  const handleSend = async () => {
    if (!message.trim() && attachments.length === 0) return

    const content: MessageContent = {
      attachments: attachments.length > 0 ? attachments : undefined
    }

    try {
      await onSendMessage(message, content)
      setMessage('')
      setAttachments([])
      setTyping(false)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (value: string) => {
    setMessage(value)
    
    if (value.trim()) {
      setTyping(true)
      const timeout = setTimeout(() => setTyping(false), 2000)
      return () => clearTimeout(timeout)
    } else {
      setTyping(false)
    }
  }

  const handleFileUpload = async (files: FileList) => {
    if (!files.length) return

    setIsUploading(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const url = await uploadFile(file)
        return {
          type: file.type.startsWith('image/') ? 'image' : 
                file.type.startsWith('video/') ? 'video' :
                file.type.startsWith('audio/') ? 'audio' : 'file',
          url,
          meta: {
            name: file.name,
            size: file.size
          }
        }
      })

      const newAttachments = await Promise.all(uploadPromises)
      setAttachments(prev => [...prev, ...newAttachments])
    } catch (error) {
      console.error('Failed to upload files:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleVigilSelect = (vigil: { code: string; url: string }) => {
    const vigilAttachment = {
      type: 'vigil' as const,
      url: vigil.url,
      meta: {
        code: vigil.code,
        name: `Vigil ${vigil.code}`
      }
    }
    setAttachments(prev => [...prev, vigilAttachment])
    setShowVigilPicker(false)
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="border-t border-purple-500/20 p-4 bg-black/20">
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((attachment, index) => (
            <div key={index} className="relative bg-gray-800 rounded-lg p-2 flex items-center space-x-2">
              {attachment.type === 'image' && (
                <img src={attachment.url} alt="" className="w-8 h-8 rounded object-cover" />
              )}
              {attachment.type === 'vigil' && (
                <div className="w-8 h-8 bg-purple-900 rounded flex items-center justify-center">
                  <span className="text-xs">🔮</span>
                </div>
              )}
              <span className="text-sm text-gray-300 truncate max-w-32">
                {attachment.meta.name}
              </span>
              <button
                onClick={() => removeAttachment(index)}
                className="text-gray-500 hover:text-gray-300"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end space-x-2">
        <div className="flex-1">
          <Textarea
            value={message}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[40px] max-h-32 resize-none bg-gray-800 border-gray-700 text-gray-200 placeholder:text-gray-400 focus:border-purple-500"
            disabled={disabled}
          />
        </div>

        <div className="flex items-center space-x-1">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*"
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            className="hidden"
          />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
            className="text-gray-400 hover:text-white"
          >
            <Paperclip className="w-4 h-4" />
          </Button>

          <VigilPicker
            open={showVigilPicker}
            onOpenChange={setShowVigilPicker}
            onSelect={handleVigilSelect}
          />

          <Button
            onClick={handleSend}
            disabled={disabled || (!message.trim() && attachments.length === 0)}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
