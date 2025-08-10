import { useState, useEffect, useCallback } from 'react'
import { supabase, type PresenceState } from '../lib/supabase-messenger'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function usePresence(threadId: string | null) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const [members, setMembers] = useState<Record<string, PresenceState>>({})
  const [isTyping, setIsTyping] = useState(false)

  // Join presence channel
  useEffect(() => {
    if (!threadId) return

    const presenceChannel = supabase.channel(`presence:thread:${threadId}`, {
      config: {
        presence: {
          key: 'user_presence',
        },
      },
    })

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        const presenceMembers: Record<string, PresenceState> = {}
        
        Object.entries(state).forEach(([key, presences]) => {
          if (presences && presences.length > 0) {
            presenceMembers[key] = presences[0] as PresenceState
          }
        })
        
        setMembers(presenceMembers)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        setMembers(prev => ({
          ...prev,
          [key]: newPresences[0] as PresenceState
        }))
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setMembers(prev => {
          const updated = { ...prev }
          delete updated[key]
          return updated
        })
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Get current user info
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            await presenceChannel.track({
              user_id: user.id,
              display_name: user.user_metadata?.full_name || user.email?.split('@')[0],
              avatar_url: user.user_metadata?.avatar_url,
              typing: false,
              last_seen: new Date().toISOString(),
            })
          }
        }
      })

    setChannel(presenceChannel)

    return () => {
      presenceChannel.unsubscribe()
      setChannel(null)
      setMembers({})
    }
  }, [threadId])

  // Set typing status
  const setTyping = useCallback(async (typing: boolean) => {
    if (!channel) return

    setIsTyping(typing)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await channel.track({
        user_id: user.id,
        display_name: user.user_metadata?.full_name || user.email?.split('@')[0],
        avatar_url: user.user_metadata?.avatar_url,
        typing,
        last_seen: new Date().toISOString(),
      })
    }
  }, [channel])

  // Get online members (excluding current user)
  const onlineMembers = Object.values(members).filter(member => {
    const { data: { user } } = supabase.auth.getUser()
    return member.user_id !== user?.id
  })

  // Get typing members (excluding current user)
  const typingMembers = onlineMembers.filter(member => member.typing)

  return {
    members: onlineMembers,
    typingMembers,
    isTyping,
    setTyping,
    isOnline: onlineMembers.length > 0,
  }
}
