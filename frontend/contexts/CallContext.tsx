import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import backend from '~backend/client'
import { useWebRTC } from '../hooks/useWebRTC'
import type { Call } from '~backend/messenger/types'

type CallState = 'idle' | 'outgoing' | 'incoming' | 'connected'

interface CallContextType {
  callState: CallState
  activeCall: Call | null
  incomingCall: Call | null
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  isMuted: boolean
  isVideoEnabled: boolean;
  isRecording: boolean;
  startCall: (receiverId: string, type: 'voice' | 'video', threadId: string, sessionType?: string) => Promise<void>
  answerCall: () => Promise<void>
  declineCall: () => Promise<void>
  endCall: () => Promise<void>
  toggleMute: () => void
  toggleVideo: () => void;
  startRecording: () => void;
  stopRecording: () => Promise<void>;
}

const CallContext = createContext<CallContextType | undefined>(undefined)

export function useCall() {
  const context = useContext(CallContext)
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider')
  }
  return context
}

// This hook listens for global events dispatched from the event stream
function useGlobalCallEvents(
  setIncomingCall: (call: Call | null) => void,
  setActiveCall: (call: Call | null) => void,
  setCallState: (state: CallState) => void
) {
  useEffect(() => {
    const handleIncomingCall = (event: CustomEvent<Call>) => {
      setIncomingCall(event.detail)
      setCallState('incoming')
    }

    const handleCallStatusUpdate = (event: CustomEvent<Call>) => {
      const call = event.detail
      if (call.status === 'answered') {
        setActiveCall(call)
        setCallState('connected')
      } else if (['declined', 'ended', 'missed'].includes(call.status)) {
        setIncomingCall(null)
        setActiveCall(null)
        setCallState('idle')
      }
    }

    window.addEventListener('incomingCall', handleIncomingCall as EventListener)
    window.addEventListener('callStatusUpdate', handleCallStatusUpdate as EventListener)

    return () => {
      window.removeEventListener('incomingCall', handleIncomingCall as EventListener)
      window.removeEventListener('callStatusUpdate', handleCallStatusUpdate as EventListener)
    }
  }, [setIncomingCall, setActiveCall, setCallState])
}

export function CallProvider({ children }: { children: ReactNode }) {
  const [callState, setCallState] = useState<CallState>('idle')
  const [activeCall, setActiveCall] = useState<Call | null>(null)
  const [incomingCall, setIncomingCall] = useState<Call | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isRecording, setIsRecording] = useState(false);

  const {
    localStream,
    remoteStream,
    createPeerConnection,
    closePeerConnection,
    toggleMute: toggleWebRTCMute,
    toggleVideo: toggleWebRTCVideo,
    startRecording: startWebRTCRecording,
    stopRecording: stopWebRTCRecording,
  } = useWebRTC(activeCall?.id || incomingCall?.id || null)

  useGlobalCallEvents(setIncomingCall, setActiveCall, setCallState)

  const startCall = async (receiverId: string, type: 'voice' | 'video', threadId: string, sessionType: string = 'standard') => {
    try {
      let finalThreadId = threadId;
      if (!finalThreadId) {
        const { threadId: newThreadId } = await backend.messenger.start({ memberIds: [receiverId] });
        finalThreadId = newThreadId;
      }

      const { call } = await backend.messenger.initiateCall({ receiverId, type, threadId: finalThreadId, sessionType })
      setActiveCall(call)
      setCallState('outgoing')
      await createPeerConnection(true, type)
    } catch (error) {
      console.error('Failed to start call:', error)
    }
  }

  const answerCall = async () => {
    if (!incomingCall) return
    try {
      const { call } = await backend.messenger.updateCallStatus({ callId: incomingCall.id, status: 'answered' })
      setActiveCall(call)
      setIncomingCall(null)
      setCallState('connected')
      await createPeerConnection(false, call.type)
    } catch (error) {
      console.error('Failed to answer call:', error)
    }
  }

  const declineCall = async () => {
    if (!incomingCall) return
    try {
      await backend.messenger.updateCallStatus({ callId: incomingCall.id, status: 'declined' })
      setIncomingCall(null)
      setCallState('idle')
    } catch (error) {
      console.error('Failed to decline call:', error)
    }
  }

  const endCall = async () => {
    const callToEnd = activeCall || incomingCall
    if (!callToEnd) return
    try {
      if (isRecording) {
        await stopRecording();
      }
      await backend.messenger.updateCallStatus({ callId: callToEnd.id, status: 'ended' })
      setActiveCall(null)
      setIncomingCall(null)
      setCallState('idle')
      closePeerConnection()
    } catch (error) {
      console.error('Failed to end call:', error)
    }
  }

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev)
    toggleWebRTCMute()
  }, [toggleWebRTCMute])

  const toggleVideo = useCallback(() => {
    setIsVideoEnabled(prev => !prev)
    toggleWebRTCVideo()
  }, [toggleWebRTCVideo])

  const startRecording = useCallback(() => {
    if (activeCall) {
      startWebRTCRecording();
      setIsRecording(true);
    }
  }, [activeCall, startWebRTCRecording]);

  const stopRecording = useCallback(async () => {
    if (activeCall) {
      const blob = await stopWebRTCRecording();
      if (blob) {
        try {
          // Get upload URL
          const { uploadUrl, publicUrl } = await backend.messenger.getRecordingUploadUrl({
            callId: activeCall.id,
            contentType: blob.type,
          });

          // Upload
          await fetch(uploadUrl, {
            method: 'PUT',
            body: blob,
            headers: { 'Content-Type': blob.type },
          });

          // Save URL
          await backend.messenger.saveRecordingUrl({
            callId: activeCall.id,
            recordingUrl: publicUrl,
          });
        } catch (error) {
          console.error("Failed to upload recording:", error);
        }
      }
      setIsRecording(false);
    }
  }, [activeCall, stopWebRTCRecording]);

  const value = {
    callState,
    activeCall,
    incomingCall,
    localStream,
    remoteStream,
    isMuted,
    isVideoEnabled,
    isRecording,
    startCall,
    answerCall,
    declineCall,
    endCall,
    toggleMute,
    toggleVideo,
    startRecording,
    stopRecording,
  }

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>
}
