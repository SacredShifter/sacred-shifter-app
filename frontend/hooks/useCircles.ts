import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import backend from '~backend/client'
import type { SocialCircle } from '~backend/social/circles'

export function useCircles() {
  const queryClient = useQueryClient()

  const { data: circlesData, isLoading: loading, error } = useQuery({
    queryKey: ['social-circles'],
    queryFn: () => backend.social.listCircles(),
  })

  const createCircleMutation = useMutation({
    mutationFn: (data: {
      name: string
      description?: string
      is_public?: boolean
    }) => backend.social.createCircle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-circles'] })
    },
  })

  const joinCircleMutation = useMutation({
    mutationFn: (circleId: string) => backend.social.joinCircle({ circle_id: circleId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-circles'] })
    },
  })

  const leaveCircleMutation = useMutation({
    mutationFn: (circleId: string) => backend.social.leaveCircle({ circle_id: circleId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-circles'] })
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
