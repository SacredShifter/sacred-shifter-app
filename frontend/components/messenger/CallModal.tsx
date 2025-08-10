import { useState, useEffect, useRef } from 'react'
import { Phone, Mic, MicOff, Video, VideoOff, PhoneOff, Circle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCall } from '../../contexts/CallContext'

export default function CallModal() {
  const {
    callState,
    activeCall,
    localStream,
    remoteStream,
    endCall,
    isMuted,
    toggleMute,
    isVideoEnabled,
    toggleVideo,
    isRecording,
    startRecording,
    stopRecording,
  } = useCall()
  
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  if (callState === 'idle') {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col relative">
        {activeCall?.session_type === 'guidance' && (
          <div className="absolute top-4 left-4 z-10">
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              <Sparkles className="w-3 h-3 mr-1" />
              Guidance Session
            </Badge>
          </div>
        )}
        {/* Remote Video */}
        <div className="flex-1 bg-black rounded-t-lg relative">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-contain"
          />
          {callState === 'outgoing' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white text-lg">Calling...</p>
            </div>
          )}
        </div>

        {/* Local Video */}
        <div className="absolute bottom-24 right-4 w-48 h-36 bg-black rounded-lg overflow-hidden border-2 border-gray-700">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>

        {/* Controls */}
        <div className="bg-gray-800 p-4 flex items-center justify-center space-x-4 rounded-b-lg">
          <Button
            variant="secondary"
            size="lg"
            onClick={toggleMute}
            className="rounded-full w-16 h-16"
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={toggleVideo}
            className="rounded-full w-16 h-16"
          >
            {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </Button>
          <Button
            variant={isRecording ? 'destructive' : 'secondary'}
            size="lg"
            onClick={handleToggleRecording}
            className="rounded-full w-16 h-16"
          >
            <Circle className={`w-6 h-6 ${isRecording ? 'fill-current' : ''}`} />
          </Button>
          <Button
            variant="destructive"
            size="lg"
            onClick={endCall}
            className="rounded-full w-16 h-16"
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  )
}
