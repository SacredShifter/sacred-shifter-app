import { useState } from 'react'
import { MapPin, Link as LinkIcon, Calendar, Edit, Users, Heart, MessageCircle, Share, Settings, UserPlus, UserMinus, Phone, Video } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import backend from '~backend/client'
import { formatDistanceToNow } from 'date-fns'
import type { SocialProfile, SocialPost } from '~backend/social/types'
import { useCall } from '../../contexts/CallContext'

interface UserProfileProps {
  userId: string
  isOwnProfile?: boolean
}

export default function UserProfile({ userId, isOwnProfile = false }: UserProfileProps) {
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    display_name: '',
    bio: '',
    location: '',
    website: '',
    spiritual_path: '',
    experience_level: '',
    interests: [] as string[]
  })
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { startCall } = useCall()

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => backend.social.getProfile({ userId }),
  })

  const { data: stats } = useQuery({
    queryKey: ['user-stats', userId],
    queryFn: () => backend.social.getProfileStats({ userId }),
  })

  const { data: followStats } = useQuery({
    queryKey: ['follow-stats', userId],
    queryFn: () => backend.social.getFollowStats({ userId }),
  })

  const { data: userPosts } = useQuery({
    queryKey: ['user-posts', userId],
    queryFn: () => backend.social.listPosts({ author_id: userId }),
  })

  const { data: userShares } = useQuery({
    queryKey: ['user-shares', userId],
    queryFn: () => backend.social.getUserShares({ userId }),
  })

  const followMutation = useMutation({
    mutationFn: () => backend.social.followUser({ userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-stats', userId] })
      queryClient.invalidateQueries({ queryKey: ['user-profile', userId] })
      toast({
        title: "✨ Following",
        description: `You're now following ${profile?.display_name || 'this user'}'s journey.`,
      })
    },
    onError: (error) => {
      console.error('Failed to follow user:', error)
      toast({
        title: "⚠️ Follow Failed",
        description: "Failed to follow user. Please try again.",
        variant: "destructive",
      })
    },
  })

  const unfollowMutation = useMutation({
    mutationFn: () => backend.social.unfollowUser({ userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-stats', userId] })
      queryClient.invalidateQueries({ queryKey: ['user-profile', userId] })
      toast({
        title: "Unfollowed",
        description: `You've stopped following ${profile?.display_name || 'this user'}.`,
      })
    },
    onError: (error) => {
      console.error('Failed to unfollow user:', error)
      toast({
        title: "⚠️ Unfollow Failed",
        description: "Failed to unfollow user. Please try again.",
        variant: "destructive",
      })
    },
  })

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => backend.social.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', userId] })
      setIsEditProfileOpen(false)
      toast({
        title: "✨ Profile Updated",
        description: "Your sacred profile has been updated.",
      })
    },
    onError: (error) => {
      console.error('Failed to update profile:', error)
      toast({
        title: "⚠️ Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    },
  })

  const handleFollow = () => {
    if (followStats?.is_following) {
      unfollowMutation.mutate()
    } else {
      followMutation.mutate()
    }
  }

  const handleEditProfile = () => {
    if (profile) {
      setEditForm({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        spiritual_path: profile.spiritual_path || '',
        experience_level: profile.experience_level || '',
        interests: profile.interests || []
      })
      setIsEditProfileOpen(true)
    }
  }

  const handleUpdateProfile = () => {
    updateProfileMutation.mutate({
      ...editForm,
      interests: editForm.interests.filter(Boolean)
    })
  }

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-16">
        <p className="text-purple-400">User not found</p>
      </div>
    )
  }

  const authorName = profile.display_name || profile.username
  const authorInitials = authorName.split(' ').map(n => n[0]).join('').toUpperCase()

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="bg-black/30 backdrop-blur-lg border-purple-500/30">
        <CardContent className="p-0">
          {/* Cover Image */}
          <div className="h-32 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 rounded-t-lg relative">
            {profile.cover_image_url && (
              <img 
                src={profile.cover_image_url} 
                alt="Cover" 
                className="w-full h-full object-cover rounded-t-lg"
              />
            )}
          </div>

          {/* Profile Info */}
          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-16 mb-4">
              <Avatar className="w-32 h-32 ring-4 ring-purple-900 bg-purple-900">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-2xl">
                  {authorInitials}
                </AvatarFallback>
              </Avatar>

              <div className="flex items-center space-x-2">
                {isOwnProfile ? (
                  <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        onClick={handleEditProfile}
                        className="border-purple-400 text-purple-300 hover:bg-purple-800/50"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl bg-gradient-to-br from-purple-900 to-indigo-900 border-purple-500/30">
                      <DialogHeader>
                        <DialogTitle className="text-purple-100">Edit Sacred Profile</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            placeholder="Display name"
                            value={editForm.display_name}
                            onChange={(e) => setEditForm(prev => ({ ...prev, display_name: e.target.value }))}
                            className="bg-black/30 border-purple-500/30 text-purple-100"
                          />
                          <Input
                            placeholder="Location"
                            value={editForm.location}
                            onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                            className="bg-black/30 border-purple-500/30 text-purple-100"
                          />
                        </div>
                        <Input
                          placeholder="Website"
                          value={editForm.website}
                          onChange={(e) => setEditForm(prev => ({ ...prev, website: e.target.value }))}
                          className="bg-black/30 border-purple-500/30 text-purple-100"
                        />
                        <Textarea
                          placeholder="Bio - Share your spiritual journey..."
                          value={editForm.bio}
                          onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                          rows={3}
                          className="bg-black/30 border-purple-500/30 text-purple-100"
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            placeholder="Spiritual path"
                            value={editForm.spiritual_path}
                            onChange={(e) => setEditForm(prev => ({ ...prev, spiritual_path: e.target.value }))}
                            className="bg-black/30 border-purple-500/30 text-purple-100"
                          />
                          <Select 
                            value={editForm.experience_level} 
                            onValueChange={(value) => setEditForm(prev => ({ ...prev, experience_level: value }))}
                          >
                            <SelectTrigger className="bg-black/30 border-purple-500/30 text-purple-100">
                              <SelectValue placeholder="Experience level" />
                            </SelectTrigger>
                            <SelectContent className="bg-purple-900 border-purple-500/30">
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                              <SelectItem value="master">Master</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Input
                          placeholder="Interests (comma separated)"
                          value={editForm.interests.join(', ')}
                          onChange={(e) => setEditForm(prev => ({ 
                            ...prev, 
                            interests: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                          }))}
                          className="bg-black/30 border-purple-500/30 text-purple-100"
                        />
                        <Button
                          onClick={handleUpdateProfile}
                          disabled={updateProfileMutation.isPending}
                          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600"
                        >
                          {updateProfileMutation.isPending ? 'Updating...' : 'Update Profile'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <>
                    <Button 
                      variant="outline"
                      className="border-purple-400 text-purple-300 hover:bg-purple-800/50"
                      onClick={() => startCall(profile.user_id, 'voice', '')}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Voice Call
                    </Button>
                    <Button 
                      variant="outline"
                      className="border-purple-400 text-purple-300 hover:bg-purple-800/50"
                      onClick={() => startCall(profile.user_id, 'video', '')}
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Video Call
                    </Button>
                    <Button 
                      onClick={handleFollow}
                      disabled={followMutation.isPending || unfollowMutation.isPending}
                      className={followStats?.is_following 
                        ? "bg-purple-800 hover:bg-purple-900 border border-purple-600" 
                        : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                      }
                    >
                      {followStats?.is_following ? (
                        <>
                          <UserMinus className="w-4 h-4 mr-2" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Follow
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <h1 className="text-2xl font-bold text-purple-100">{authorName}</h1>
                  {profile.is_verified && (
                    <Badge className="bg-blue-100 text-blue-800">✓ Verified</Badge>
                  )}
                  {profile.experience_level && (
                    <Badge variant="outline" className="border-purple-400 text-purple-300 capitalize">
                      {profile.experience_level}
                    </Badge>
                  )}
                </div>
                <p className="text-purple-300">@{profile.username}</p>
              </div>

              {profile.bio && (
                <p className="text-purple-200 leading-relaxed">{profile.bio}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-purple-300">
                {profile.location && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.website && (
                  <div className="flex items-center space-x-1">
                    <LinkIcon className="w-4 h-4" />
                    <a 
                      href={profile.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300"
                    >
                      {profile.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                {profile.spiritual_path && (
                  <div className="flex items-center space-x-1">
                    <span>✨ {profile.spiritual_path}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}</span>
                </div>
              </div>

              {profile.interests && profile.interests.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest, index) => (
                    <Badge key={index} variant="outline" className="border-purple-400 text-purple-300">
                      {interest}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center space-x-6 pt-4 border-t border-purple-500/20">
                <div className="text-center">
                  <p className="text-xl font-bold text-purple-100">{stats?.posts_count || 0}</p>
                  <p className="text-sm text-purple-400">Transmissions</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-purple-100">{followStats?.following_count || 0}</p>
                  <p className="text-sm text-purple-400">Following</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-purple-100">{followStats?.follower_count || 0}</p>
                  <p className="text-sm text-purple-400">Resonators</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-purple-100">{stats?.likes_received || 0}</p>
                  <p className="text-sm text-purple-400">Resonance</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs defaultValue="posts" className="space-y-4">
        <TabsList className="bg-black/30 border border-purple-500/30">
          <TabsTrigger value="posts" className="data-[state=active]:bg-purple-600">
            Transmissions
          </TabsTrigger>
          <TabsTrigger value="shares" className="data-[state=active]:bg-purple-600">
            Shared
          </TabsTrigger>
          <TabsTrigger value="media" className="data-[state=active]:bg-purple-600">
            Media
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          {userPosts?.posts.map((post) => (
            <Card key={post.id} className="bg-black/30 backdrop-blur-lg border-purple-500/30">
              <CardContent className="p-4">
                <p className="text-purple-100 mb-3">{post.content}</p>
                <div className="flex items-center justify-between text-sm text-purple-400">
                  <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center space-x-1">
                      <Heart className="w-4 h-4" />
                      <span>{post.like_count}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.comment_count}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Share className="w-4 h-4" />
                      <span>{post.share_count}</span>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {(!userPosts?.posts || userPosts.posts.length === 0) && (
            <div className="text-center py-8">
              <p className="text-purple-400">No transmissions yet</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="shares" className="space-y-4">
          {userShares?.shares.map((share) => (
            <Card key={share.id} className="bg-black/30 backdrop-blur-lg border-purple-500/30">
              <CardContent className="p-4">
                {share.content && (
                  <p className="text-purple-200 mb-3 italic">"{share.content}"</p>
                )}
                <div className="bg-purple-800/30 rounded-lg p-3 border border-purple-500/30">
                  <p className="text-purple-100 mb-2">{share.post.content}</p>
                  <p className="text-sm text-purple-400">
                    by {share.post.author.display_name || share.post.author.username}
                  </p>
                </div>
                <p className="text-sm text-purple-400 mt-2">
                  Shared {formatDistanceToNow(new Date(share.created_at), { addSuffix: true })}
                </p>
              </CardContent>
            </Card>
          ))}
          {(!userShares?.shares || userShares.shares.length === 0) && (
            <div className="text-center py-8">
              <p className="text-purple-400">No shared transmissions yet</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="media" className="space-y-4">
          <div className="text-center py-8">
            <p className="text-purple-400">Media gallery coming soon</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
