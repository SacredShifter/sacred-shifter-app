import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import backend from '~backend/client'
import { useToast } from '@/components/ui/use-toast'
import type { SocialCircle } from '~backend/social/types'

export function useCircles() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: circlesData, isLoading: loading, error } = useQuery({
    queryKey: ['social-circles'],
    queryFn: () => backend.social.listCircles(),
  })

  const createCircleMutation = useMutation({
    mutationFn: async (data: {
      name: string
      description?: string
      is_public: boolean
    }) => {
      return backend.social.createCircle(data)
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
      return backend.social.joinCircle({ circleId })
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
      return backend.social.leaveCircle({ circleId })
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

  const circles: SocialCircle[] = circlesData?.circles || []
  const myCircles = circles.filter(circle => circle.is_member)

  const createCircle = async (data: {
    name: string
    description?: string
    is_public: boolean
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
