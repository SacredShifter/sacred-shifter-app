import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, MessageCircle, Bell, Search, Menu, ArrowLeft, Plus, Heart, Share, MoreHorizontal, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import backend from '~backend/client';

export default function SacredNetworkPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostVisibility, setNewPostVisibility] = useState<'public' | 'followers' | 'private'>('public');
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [newCircleName, setNewCircleName] = useState('');
  const [newCircleDescription, setNewCircleDescription] = useState('');
  const [isCreateCircleOpen, setIsCreateCircleOpen] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState<string | null>(null);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data using the actual Sacred Shifter backend
  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['social-posts', selectedCircle],
    queryFn: () => backend.social.listPosts(selectedCircle ? { circle_id: selectedCircle } : {}),
  });

  const { data: circles } = useQuery({
    queryKey: ['social-circles'],
    queryFn: () => backend.social.listCircles(),
  });

  const { data: profile } = useQuery({
    queryKey: ['social-profile'],
    queryFn: () => backend.social.getProfile(),
  });

  const { data: stats } = useQuery({
    queryKey: ['social-stats'],
    queryFn: () => backend.social.getStats(),
  });

  const { data: messages } = useQuery({
    queryKey: ['social-messages'],
    queryFn: () => backend.social.listMessages(),
    enabled: isMessagesOpen,
  });

  // Mutations
  const createPostMutation = useMutation({
    mutationFn: (data: { content: string; visibility: 'public' | 'followers' | 'private'; circle_id?: string }) =>
      backend.social.createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      queryClient.invalidateQueries({ queryKey: ['social-stats'] });
      setNewPostContent('');
      setIsCreatePostOpen(false);
      toast({
        title: "Success",
        description: "Your post has been shared!",
      });
    },
    onError: (error) => {
      console.error('Failed to create post:', error);
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: (postId: string) => backend.social.toggleLike({ post_id: postId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
    },
    onError: (error) => {
      console.error('Failed to toggle like:', error);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createCircleMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; is_public?: boolean }) =>
      backend.social.createCircle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-circles'] });
      queryClient.invalidateQueries({ queryKey: ['social-stats'] });
      setNewCircleName('');
      setNewCircleDescription('');
      setIsCreateCircleOpen(false);
      toast({
        title: "Success",
        description: "Your circle has been created!",
      });
    },
    onError: (error) => {
      console.error('Failed to create circle:', error);
      toast({
        title: "Error",
        description: "Failed to create circle. Please try again.",
        variant: "destructive",
      });
    },
  });

  const joinCircleMutation = useMutation({
    mutationFn: (circleId: string) => backend.social.joinCircle({ circle_id: circleId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-circles'] });
      toast({
        title: "Success",
        description: "You've joined the circle!",
      });
    },
    onError: (error) => {
      console.error('Failed to join circle:', error);
      toast({
        title: "Error",
        description: "Failed to join circle. Please try again.",
        variant: "destructive",
      });
    },
  });

  const leaveCircleMutation = useMutation({
    mutationFn: (circleId: string) => backend.social.leaveCircle({ circle_id: circleId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-circles'] });
      if (selectedCircle) {
        setSelectedCircle(null);
      }
      toast({
        title: "Success",
        description: "You've left the circle.",
      });
    },
    onError: (error) => {
      console.error('Failed to leave circle:', error);
      toast({
        title: "Error",
        description: "Failed to leave circle. Please try again.",
        variant: "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data: { recipient_id: string; content: string }) =>
      backend.social.sendMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-messages'] });
      setNewMessage('');
      toast({
        title: "Success",
        description: "Message sent!",
      });
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreatePost = () => {
    if (!newPostContent.trim()) {
      toast({
        title: "Error",
        description: "Please write something before posting.",
        variant: "destructive",
      });
      return;
    }

    createPostMutation.mutate({
      content: newPostContent,
      visibility: newPostVisibility,
      circle_id: selectedCircle || undefined,
    });
  };

  const handleCreateCircle = () => {
    if (!newCircleName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a circle name.",
        variant: "destructive",
      });
      return;
    }

    createCircleMutation.mutate({
      name: newCircleName,
      description: newCircleDescription || undefined,
      is_public: true,
    });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) {
      toast({
        title: "Error",
        description: "Please write a message and select a recipient.",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({
      recipient_id: selectedConversation,
      content: newMessage,
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const selectedCircleData = circles?.circles.find(c => c.id === selectedCircle);

  if (postsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side */}
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sacred Shifter
                </Button>
              </Link>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SN</span>
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Sacred Network
                </h1>
                {selectedCircleData && (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">•</span>
                    <Badge variant="outline">{selectedCircleData.name}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCircle(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Center search */}
            <div className="hidden md:block flex-1 max-w-lg mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search Sacred Network..."
                  className="pl-10 bg-gray-100 border-0"
                />
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm">
                <Bell className="w-5 h-5" />
              </Button>
              
              <Avatar className="w-8 h-8">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback>{profile?.display_name?.charAt(0) || 'SS'}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className={`lg:col-span-1 ${sidebarOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="sticky top-24 space-y-6">
              {/* Profile Card */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback>{profile?.display_name?.charAt(0) || 'SS'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">{profile?.display_name || 'Sacred Seeker'}</p>
                      <p className="text-sm text-gray-500">@{profile?.username || 'sacred_seeker'}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-purple-600">{profile?.post_count || 0}</p>
                      <p className="text-xs text-gray-500">Posts</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-purple-600">{profile?.following_count || 0}</p>
                      <p className="text-xs text-gray-500">Following</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-purple-600">{profile?.follower_count || 0}</p>
                      <p className="text-xs text-gray-500">Followers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* My Circles */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">My Circles</CardTitle>
                    <Dialog open={isCreateCircleOpen} onOpenChange={setIsCreateCircleOpen}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Circle</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input
                            placeholder="Circle name..."
                            value={newCircleName}
                            onChange={(e) => setNewCircleName(e.target.value)}
                          />
                          <Textarea
                            placeholder="Circle description (optional)..."
                            value={newCircleDescription}
                            onChange={(e) => setNewCircleDescription(e.target.value)}
                            rows={3}
                          />
                          <Button
                            onClick={handleCreateCircle}
                            disabled={createCircleMutation.isPending}
                            className="w-full"
                          >
                            {createCircleMutation.isPending ? 'Creating...' : 'Create Circle'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {/* All Posts Option */}
                  <div
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      !selectedCircle ? 'bg-purple-50 border border-purple-200' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedCircle(null)}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      <span className="font-medium text-sm">All Posts</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {posts?.total || 0}
                    </Badge>
                  </div>

                  {/* User's Circles */}
                  {circles?.circles.filter(circle => circle.is_member).map((circle) => (
                    <div
                      key={circle.id}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedCircle === circle.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedCircle(circle.id)}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="font-medium text-sm">{circle.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Badge variant="outline" className="text-xs">
                          <Users className="w-3 h-3 mr-1" />
                          {circle.member_count}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            leaveCircleMutation.mutate(circle.id);
                          }}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  ))}
                  {!circles?.circles.some(circle => circle.is_member) && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No circles joined yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Post Composer */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback>{profile?.display_name?.charAt(0) || 'SS'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
                        <DialogTrigger asChild>
                          <div className="bg-gray-100 rounded-lg p-3 cursor-pointer hover:bg-gray-200 transition-colors">
                            <p className="text-gray-500">
                              {selectedCircleData 
                                ? `Share with ${selectedCircleData.name}...`
                                : 'Share your spiritual insights with the Sacred Network...'
                              }
                            </p>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>
                              {selectedCircleData 
                                ? `Create Post in ${selectedCircleData.name}`
                                : 'Create New Post'
                              }
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Textarea
                              placeholder="What's on your mind?"
                              value={newPostContent}
                              onChange={(e) => setNewPostContent(e.target.value)}
                              rows={6}
                              className="resize-none"
                            />
                            <div className="flex items-center justify-between">
                              <Select value={newPostVisibility} onValueChange={(value: 'public' | 'followers' | 'private') => setNewPostVisibility(value)}>
                                <SelectTrigger className="w-40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="public">Public</SelectItem>
                                  <SelectItem value="followers">Followers</SelectItem>
                                  <SelectItem value="private">Private</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                onClick={handleCreatePost}
                                disabled={createPostMutation.isPending}
                                className="bg-purple-600 hover:bg-purple-700"
                              >
                                {createPostMutation.isPending ? 'Posting...' : 'Share'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Feed Posts */}
              {posts?.posts.map((post) => (
                <Card key={post.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={post.author?.avatar_url} />
                        <AvatarFallback>{post.author?.display_name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-gray-900">{post.author?.display_name}</p>
                            <p className="text-sm text-gray-500">@{post.author?.username}</p>
                            <p className="text-sm text-gray-500">•</p>
                            <p className="text-sm text-gray-500">{formatTimeAgo(post.created_at)}</p>
                            {post.visibility !== 'public' && (
                              <>
                                <p className="text-sm text-gray-500">•</p>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {post.visibility}
                                </Badge>
                              </>
                            )}
                          </div>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-gray-800 leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>
                        
                        <div className="flex items-center space-x-6 text-gray-500">
                          <button 
                            className={`flex items-center space-x-1 hover:text-red-500 transition-colors ${
                              post.is_liked ? 'text-red-500' : ''
                            }`}
                            onClick={() => toggleLikeMutation.mutate(post.id)}
                          >
                            <Heart className={`w-4 h-4 ${post.is_liked ? 'fill-current' : ''}`} />
                            <span className="text-sm">{post.like_count}</span>
                          </button>
                          <button className="flex items-center space-x-1 hover:text-blue-500 transition-colors">
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-sm">{post.comment_count}</span>
                          </button>
                          <button className="flex items-center space-x-1 hover:text-green-500 transition-colors">
                            <Share className="w-4 h-4" />
                            <span className="text-sm">Share</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {(!posts?.posts || posts.posts.length === 0) && (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-gray-500">
                      {selectedCircleData 
                        ? `No posts in ${selectedCircleData.name} yet. Be the first to share something!`
                        : 'No posts yet. Be the first to share something!'
                      }
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="sticky top-24 space-y-6">
              {/* Network Stats */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Network Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Posts</span>
                    <span className="font-medium">{stats?.total_posts || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Active Users</span>
                    <span className="font-medium">{stats?.total_users || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Sacred Circles</span>
                    <span className="font-medium">{stats?.total_circles || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Posts Today</span>
                    <span className="font-medium">{stats?.posts_today || 0}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Discover Circles */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Discover Circles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {circles?.circles.filter(circle => !circle.is_member).slice(0, 5).map((circle) => (
                    <div key={circle.id} className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{circle.name}</h4>
                          {circle.description && (
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {circle.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              <Users className="w-3 h-3 mr-1" />
                              {circle.member_count}
                            </Badge>
                            <Badge variant="outline" className="text-xs text-green-600">
                              Public
                            </Badge>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => joinCircleMutation.mutate(circle.id)}
                          disabled={joinCircleMutation.isPending}
                          className="ml-2"
                        >
                          {joinCircleMutation.isPending ? 'Joining...' : 'Join'}
                        </Button>
                      </div>
                    </div>
                  ))}
                  {!circles?.circles.some(circle => !circle.is_member) && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      All circles joined!
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Dialog */}
      <Dialog open={isMessagesOpen} onOpenChange={setIsMessagesOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Messages</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-96 overflow-y-auto space-y-3">
              {messages?.messages.map((message) => (
                <div key={message.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                          {message.sender?.display_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-medium text-sm">{message.sender?.display_name}</p>
                    </div>
                    <p className="text-xs text-gray-500">{formatTimeAgo(message.created_at)}</p>
                  </div>
                  <p className="text-sm text-gray-700">{message.content}</p>
                </div>
              ))}
              {(!messages?.messages || messages.messages.length === 0) && (
                <p className="text-center text-gray-500 py-8">No messages yet.</p>
              )}
            </div>
            
            <div className="border-t pt-4">
              <div className="flex space-x-2">
                <Select value={selectedConversation || ''} onValueChange={setSelectedConversation}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select recipient..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user-2">Quantum Mystic</SelectItem>
                    <SelectItem value="user-3">Dream Weaver</SelectItem>
                    <SelectItem value="user-4">Light Worker</SelectItem>
                    <SelectItem value="user-5">Frequency Healer</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={sendMessageMutation.isPending || !newMessage.trim() || !selectedConversation}
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Messages Button */}
      <Button
        className="fixed bottom-4 right-4 z-50 rounded-full w-14 h-14 shadow-lg bg-purple-600 hover:bg-purple-700"
        onClick={() => setIsMessagesOpen(true)}
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    </div>
  );
}
