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
  isVideoEnabled: boolean
  startCall: (receiverId: string, type: 'voice' | 'video', threadId: string) => Promise<void>
  answerCall: () => Promise<void>
  declineCall: () => Promise<void>
  endCall: () => Promise<void>
  toggleMute: () => void
  toggleVideo: () => void
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

  const {
    localStream,
    remoteStream,
    createPeerConnection,
    closePeerConnection,
    toggleMute: toggleWebRTCMute,
    toggleVideo: toggleWebRTCVideo,
  } = useWebRTC(activeCall?.id || incomingCall?.id || null)

  useGlobalCallEvents(setIncomingCall, setActiveCall, setCallState)

  const startCall = async (receiverId: string, type: 'voice' | 'video', threadId: string) => {
    try {
      const { call } = await backend.messenger.initiateCall({ receiverId, type, threadId })
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

  const value = {
    callState,
    activeCall,
    incomingCall,
    localStream,
    remoteStream,
    isMuted,
    isVideoEnabled,
    startCall,
    answerCall,
    declineCall,
    endCall,
    toggleMute,
    toggleVideo,
  }

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>
}
