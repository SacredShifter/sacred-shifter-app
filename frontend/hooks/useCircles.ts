import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { defaultUser } from '../config'
import { useToast } from '@/components/ui/use-toast'

interface Circle {
  id: string
  owner_id: string
  name: string
  description?: string
  is_public: boolean
  created_at: string
  member_count: number
  is_member: boolean
  owner: {
    id: string
    email: string
    user_metadata: {
      full_name?: string
      avatar_url?: string
    }
  }
}

export function useCircles() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: circlesData, isLoading: loading, error } = useQuery({
    queryKey: ['social-circles'],
    queryFn: async () => {
      // Get all circles with member counts
      const { data: circles, error } = await supabase
        .from('circles')
        .select(`
          *,
          owner:auth.users!circles_owner_id_fkey(id, email, user_metadata)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get membership info and member counts
      const circlesWithMembership = await Promise.all(
        (circles || []).map(async (circle) => {
          // Check if current user is a member
          const { data: membership } = await supabase
            .from('circle_members')
            .select('*')
            .eq('circle_id', circle.id)
            .eq('user_id', defaultUser.id)
            .single()

          // Get member count
          const { count: memberCount } = await supabase
            .from('circle_members')
            .select('*', { count: 'exact', head: true })
            .eq('circle_id', circle.id)

          return {
            ...circle,
            member_count: memberCount || 0,
            is_member: !!membership
          }
        })
      )

      return { circles: circlesWithMembership }
    },
  })

  const createCircleMutation = useMutation({
    mutationFn: async (data: {
      name: string
      description?: string
      is_public?: boolean
    }) => {
      // Create circle
      const { data: circle, error } = await supabase
        .from('circles')
        .insert({
          owner_id: defaultUser.id,
          name: data.name,
          description: data.description,
          is_public: data.is_public ?? true
        })
        .select()
        .single()

      if (error) throw error

      // Add creator as owner member
      const { error: memberError } = await supabase
        .from('circle_members')
        .insert({
          circle_id: circle.id,
          user_id: defaultUser.id,
          role: 'owner'
        })

      if (memberError) throw memberError

      return circle
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-circles'] })
      toast({
        title: "🔮 Sacred Circle Created",
        description: "Your circle has been manifested in the network.",
      })
    },
    onError: (error) => {
      console.error('Failed to create circle:', error)
      toast({
        title: "⚠️ Circle Creation Failed",
        description: "Unable to manifest your circle. Please try again.",
        variant: "destructive",
      })
    },
  })

  const joinCircleMutation = useMutation({
    mutationFn: async (circleId: string) => {
      const { error } = await supabase
        .from('circle_members')
        .insert({
          circle_id: circleId,
          user_id: defaultUser.id,
          role: 'member'
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-circles'] })
      toast({
        title: "🌟 Circle Joined",
        description: "You've entered the sacred circle.",
      })
    },
    onError: (error) => {
      console.error('Failed to join circle:', error)
      toast({
        title: "⚠️ Unable to Join",
        description: "Failed to enter the circle. Please try again.",
        variant: "destructive",
      })
    },
  })

  const leaveCircleMutation = useMutation({
    mutationFn: async (circleId: string) => {
      const { error } = await supabase
        .from('circle_members')
        .delete()
        .eq('circle_id', circleId)
        .eq('user_id', defaultUser.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-circles'] })
      toast({
        title: "🚪 Circle Left",
        description: "You've departed from the sacred circle.",
      })
    },
    onError: (error) => {
      console.error('Failed to leave circle:', error)
      toast({
        title: "⚠️ Unable to Leave",
        description: "Failed to leave the circle. Please try again.",
        variant: "destructive",
      })
    },
  })

  const circles = circlesData?.circles || []
  const myCircles = circles.filter(circle => circle.is_member)

  const createCircle = async (data: {
    name: string
    description?: string
    is_public?: boolean
  }) => {
    await createCircleMutation.mutateAsync(data)
  }

  const joinCircle = async (circleId: string) => {
    await joinCircleMutation.mutateAsync(circleId)
  }

  const leaveCircle = async (circleId: string) => {
    await leaveCircleMutation.mutateAsync(circleId)
  }

  return {
    circles,
    myCircles,
    loading,
    error,
    createCircle,
    joinCircle,
    leaveCircle,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['social-circles'] })
  }
}
