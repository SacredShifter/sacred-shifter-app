import { Download, FileText, Image, Video, Music, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AttachmentPreviewProps {
  attachment: {
    type: 'image' | 'video' | 'audio' | 'file' | 'vigil'
    url: string
    meta: {
      name?: string
      size?: number
      code?: string
    }
  }
}

export default function AttachmentPreview({ attachment }: AttachmentPreviewProps) {
  const handleDownload = () => {
    window.open(attachment.url, '_blank')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  switch (attachment.type) {
    case 'image':
      return (
        <div className="relative group">
          <img 
            src={attachment.url} 
            alt={attachment.meta.name || 'Image'} 
            className="max-w-xs max-h-64 rounded-lg cursor-pointer"
            onClick={() => window.open(attachment.url, '_blank')}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownload}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )

    case 'video':
      return (
        <div className="relative">
          <video 
            src={attachment.url} 
            controls 
            className="max-w-xs max-h-64 rounded-lg"
          />
        </div>
      )

    case 'audio':
      return (
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg max-w-xs">
          <Music className="w-6 h-6 text-gray-400" />
          <div className="flex-1">
            <p className="text-sm font-medium">{attachment.meta.name || 'Audio file'}</p>
            {attachment.meta.size && (
              <p className="text-xs text-gray-500">{formatFileSize(attachment.meta.size)}</p>
            )}
          </div>
          <audio src={attachment.url} controls className="w-32" />
        </div>
      )

    case 'vigil':
      return (
        <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg max-w-xs border border-purple-200">
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-purple-900">Sacred Vigil</p>
            <p className="text-xs text-purple-600">{attachment.meta.code}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(attachment.url, '_blank')}
            className="text-purple-600 hover:text-purple-700"
          >
            View
          </Button>
        </div>
      )

    case 'file':
    default:
      return (
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg max-w-xs">
          <FileText className="w-6 h-6 text-gray-400" />
          <div className="flex-1">
            <p className="text-sm font-medium">{attachment.meta.name || 'File'}</p>
            {attachment.meta.size && (
              <p className="text-xs text-gray-500">{formatFileSize(attachment.meta.size)}</p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4" />
          </Button>
        </div>
      )
  }
}
