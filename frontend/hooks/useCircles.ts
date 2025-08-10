import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type Circle = Database['public']['Tables']['circles']['Row'] & {
  member_count: number
  is_member: boolean
  owner: {
    id: string
    email: string
    user_metadata: {
      full_name?: string
    }
  }
}

export function useCircles() {
  const [circles, setCircles] = useState<Circle[]>([])
  const [myCircles, setMyCircles] = useState<Circle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCircles = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('circles')
        .select(`
          *,
          owner:auth.users!circles_owner_id_fkey(id, email, user_metadata),
          members:circle_members(count),
          user_membership:circle_members!inner(user_id)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const processedCircles = data?.map(circle => ({
        ...circle,
        member_count: circle.members?.[0]?.count || 0,
        is_member: !!circle.user_membership?.length
      })) || []

      setCircles(processedCircles)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch circles')
    } finally {
      setLoading(false)
    }
  }

  const fetchMyCircles = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data, error } = await supabase
        .from('circle_members')
        .select(`
          circle:circles(
            *,
            owner:auth.users!circles_owner_id_fkey(id, email, user_metadata)
          )
        `)
        .eq('user_id', user.user.id)
        .eq('role', 'member')

      if (error) throw error

      const circles = data?.map(item => ({
        ...item.circle,
        member_count: 0,
        is_member: true
      })) || []

      setMyCircles(circles)
    } catch (err) {
      console.error('Failed to fetch my circles:', err)
    }
  }

  const createCircle = async (data: {
    name: string
    description?: string
    is_public?: boolean
  }) => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Not authenticated')

      const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

      const { data: circle, error } = await supabase
        .from('circles')
        .insert({
          owner_id: user.user.id,
          name: data.name,
          slug,
          description: data.description,
          is_public: data.is_public || false
        })
        .select()
        .single()

      if (error) throw error

      // Add creator as member
      await supabase
        .from('circle_members')
        .insert({
          circle_id: circle.id,
          user_id: user.user.id,
          role: 'owner'
        })

      // Refresh circles
      fetchCircles()
      fetchMyCircles()

      return circle
    } catch (err) {
      throw err
    }
  }

  const joinCircle = async (circleId: string) => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('circle_members')
        .insert({
          circle_id: circleId,
          user_id: user.user.id,
          role: 'member'
        })

      if (error) throw error

      // Update local state
      setCircles(prev => prev.map(circle => 
        circle.id === circleId 
          ? { ...circle, is_member: true, member_count: circle.member_count + 1 }
          : circle
      ))

      fetchMyCircles()
    } catch (err) {
      throw err
    }
  }

  const leaveCircle = async (circleId: string) => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('circle_members')
        .delete()
        .eq('circle_id', circleId)
        .eq('user_id', user.user.id)

      if (error) throw error

      // Update local state
      setCircles(prev => prev.map(circle => 
        circle.id === circleId 
          ? { ...circle, is_member: false, member_count: Math.max(0, circle.member_count - 1) }
          : circle
      ))

      setMyCircles(prev => prev.filter(circle => circle.id !== circleId))
    } catch (err) {
      throw err
    }
  }

  useEffect(() => {
    fetchCircles()
    fetchMyCircles()

    // Set up real-time subscription
    const subscription = supabase
      .channel('circles')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'circles' },
        () => {
          fetchCircles()
          fetchMyCircles()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return {
    circles,
    myCircles,
    loading,
    error,
    createCircle,
    joinCircle,
    leaveCircle,
    refresh: () => {
      fetchCircles()
      fetchMyCircles()
    }
  }
}
