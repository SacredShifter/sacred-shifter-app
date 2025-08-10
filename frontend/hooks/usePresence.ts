import { useState, useEffect, useCallback } from 'react'
import backend from '~backend/client'

interface PresenceState {
  user_id: string
  display_name?: string
  avatar_url?: string
  typing?: boolean
  last_seen?: string
}

export function usePresence(threadId: string | null) {
  const [members, setMembers] = useState<Record<string, PresenceState>>({})
  const [isTyping, setIsTyping] = useState(false)
  const [stream, setStream] = useState<any>(null);

  // Join presence channel
  useEffect(() => {
    if (!threadId) return;

    let localStream: any;
    const connect = async () => {
      localStream = await backend.messenger.events({ threadId });
      setStream(localStream);
      for await (const event of localStream) {
        if (event.type === 'presence') {
          const { userId, status, isTyping } = event.payload;
          setMembers(prev => {
            const updated = { ...prev };
            if (status === 'online') {
              updated[userId] = { user_id: userId, typing: isTyping };
            } else if (status === 'offline') {
              delete updated[userId];
            } else if (status === 'typing') {
              if (updated[userId]) {
                updated[userId].typing = isTyping;
              }
            }
            return updated;
          });
        }
      }
    };

    connect();

    return () => {
      localStream?.close();
      setStream(null);
      setMembers({});
    }
  }, [threadId]);

  // Set typing status
  const setTypingStatus = useCallback(async (typing: boolean) => {
    if (!stream) return;
    setIsTyping(typing);
    await stream.send({ type: 'typing', payload: { isTyping: typing } });
  }, [stream]);

  const onlineMembers = Object.values(members).filter(member => {
    // In a real app, you'd get the current user ID and filter them out.
    return true;
  });

  const typingMembers = onlineMembers.filter(member => member.typing);

  return {
    members: onlineMembers,
    typingMembers,
    isTyping,
    setTyping: setTypingStatus,
    isOnline: onlineMembers.length > 0,
  }
}
