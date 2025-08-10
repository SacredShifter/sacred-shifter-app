import { useState, useEffect, useCallback, useRef } from 'react'
import backend from '~backend/client'

const STUN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

export function useWebRTC(callId: string | null) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const signalingStreamRef = useRef<any>(null)

  const closePeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
      setLocalStream(null)
    }
    if (signalingStreamRef.current) {
      signalingStreamRef.current.close()
      signalingStreamRef.current = null
    }
    setRemoteStream(null)
  }, [localStream])

  const createPeerConnection = useCallback(async (isCaller: boolean, type: 'voice' | 'video') => {
    closePeerConnection()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true,
      })
      setLocalStream(stream)

      const pc = new RTCPeerConnection(STUN_SERVERS)
      peerConnectionRef.current = pc

      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      pc.onicecandidate = (event) => {
        if (event.candidate && signalingStreamRef.current) {
          signalingStreamRef.current.send({
            type: 'candidate',
            payload: event.candidate,
          })
        }
      }

      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0])
      }

      // Connect to signaling server
      const signalingStream = await backend.messenger.signaling({ callId: callId! })
      signalingStreamRef.current = signalingStream

      // Listen for signaling messages
      ;(async () => {
        for await (const message of signalingStream) {
          if (!peerConnectionRef.current) break

          const { type, payload } = message
          if (type === 'offer') {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload))
            const answer = await peerConnectionRef.current.createAnswer()
            await peerConnectionRef.current.setLocalDescription(answer)
            signalingStream.send({ type: 'answer', payload: answer })
          } else if (type === 'answer') {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload))
          } else if (type === 'candidate') {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(payload))
          } else if (type === 'hangup') {
            closePeerConnection()
          }
        }
      })()

      if (isCaller) {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        signalingStream.send({ type: 'offer', payload: offer })
      }
    } catch (error) {
      console.error('Error creating peer connection:', error)
      closePeerConnection()
    }
  }, [callId, closePeerConnection])

  const toggleMute = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled
      })
    }
  }, [localStream])

  const toggleVideo = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled
      })
    }
  }, [localStream])

  return {
    localStream,
    remoteStream,
    createPeerConnection,
    closePeerConnection,
    toggleMute,
    toggleVideo,
  }
}
