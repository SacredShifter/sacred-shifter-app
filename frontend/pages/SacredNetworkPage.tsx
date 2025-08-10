import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, MessageCircle, Bell, Search, Menu, ArrowLeft, Plus, Heart, Share, MoreHorizontal, Eye, X, Send, Sparkles, Zap, Star } from 'lucide-react';
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
import MessengerDrawer from '../components/messenger/MessengerDrawer';

export default function SacredNetworkPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostVisibility, setNewPostVisibility] = useState<'public' | 'followers' | 'private'>('public');
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [newCircleName, setNewCircleName] = useState('');
  const [newCircleDescription, setNewCircleDescription] = useState('');
  const [isCreateCircleOpen, setIsCreateCircleOpen] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState<string | null>(null);
  const [isMessengerOpen, setIsMessengerOpen] = useState(false);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
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
        title: "✨ Sacred Transmission Sent",
        description: "Your wisdom has been shared with the network.",
      });
    },
    onError: (error) => {
      console.error('Failed to create post:', error);
      toast({
        title: "⚠️ Transmission Failed",
        description: "Unable to share your wisdom. Please try again.",
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
        title: "⚠️ Resonance Failed",
        description: "Unable to register your resonance. Please try again.",
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
        title: "🔮 Sacred Circle Created",
        description: "Your circle has been manifested in the network.",
      });
    },
    onError: (error) => {
      console.error('Failed to create circle:', error);
      toast({
        title: "⚠️ Circle Creation Failed",
        description: "Unable to manifest your circle. Please try again.",
        variant: "destructive",
      });
    },
  });

  const joinCircleMutation = useMutation({
    mutationFn: (circleId: string) => backend.social.joinCircle({ circle_id: circleId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-circles'] });
      toast({
        title: "🌟 Circle Joined",
        description: "You've entered the sacred circle.",
      });
    },
    onError: (error) => {
      console.error('Failed to join circle:', error);
      toast({
        title: "⚠️ Unable to Join",
        description: "Failed to enter the circle. Please try again.",
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
        title: "🚪 Circle Left",
        description: "You've departed from the sacred circle.",
      });
    },
    onError: (error) => {
      console.error('Failed to leave circle:', error);
      toast({
        title: "⚠️ Unable to Leave",
        description: "Failed to leave the circle. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: (data: { post_id: string; content: string }) =>
      backend.social.createComment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      setNewComment('');
      toast({
        title: "💬 Reflection Added",
        description: "Your wisdom has been shared.",
      });
    },
    onError: (error) => {
      console.error('Failed to create comment:', error);
      toast({
        title: "⚠️ Reflection Failed",
        description: "Unable to share your reflection. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreatePost = () => {
    if (!newPostContent.trim()) {
      toast({
        title: "⚠️ Empty Transmission",
        description: "Please share your wisdom before transmitting.",
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
        title: "⚠️ Circle Needs a Name",
        description: "Please name your sacred circle.",
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

  const handleCreateComment = (postId: string) => {
    if (!newComment.trim()) {
      toast({
        title: "⚠️ Empty Reflection",
        description: "Please write your reflection before sharing.",
        variant: "destructive",
      });
      return;
    }

    createCommentMutation.mutate({
      post_id: postId,
      content: newComment,
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-300 mx-auto mb-4" />
          <p className="text-purple-200">Connecting to the Sacred Network...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* Top Navigation */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-purple-500/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side */}
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="text-purple-200 hover:text-white hover:bg-purple-800/50">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Return to Sacred Shifter
                </Button>
              </Link>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-purple-200 hover:text-white hover:bg-purple-800/50"
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full flex items-center justify-center shadow-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
                    Sacred Network
                  </h1>
                  <p className="text-xs text-purple-300">Consciousness Collective</p>
                </div>
                {selectedCircleData && (
                  <div className="flex items-center space-x-2">
                    <span className="text-purple-400">•</span>
                    <Badge variant="outline" className="border-purple-400 text-purple-200 bg-purple-900/50">
                      {selectedCircleData.name}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCircle(null)}
                      className="text-purple-300 hover:text-white"
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4" />
                <Input
                  placeholder="Search the Sacred Network..."
                  className="pl-10 bg-black/30 border-purple-500/30 text-purple-100 placeholder:text-purple-400 focus:border-purple-400"
                />
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="text-purple-200 hover:text-white hover:bg-purple-800/50">
                <Bell className="w-5 h-5" />
              </Button>
              
              <Avatar className="w-8 h-8 ring-2 ring-purple-400/50">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                  {profile?.display_name?.charAt(0) || 'SS'}
                </AvatarFallback>
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
              <Card className="bg-black/30 backdrop-blur-lg border-purple-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12 ring-2 ring-purple-400/50">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                        {profile?.display_name?.charAt(0) || 'SS'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-purple-100">{profile?.display_name || 'Sacred Seeker'}</p>
                      <p className="text-sm text-purple-300">@{profile?.username || 'sacred_seeker'}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        {profile?.post_count || 0}
                      </p>
                      <p className="text-xs text-purple-400">Transmissions</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        {profile?.following_count || 0}
                      </p>
                      <p className="text-xs text-purple-400">Following</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        {profile?.follower_count || 0}
                      </p>
                      <p className="text-xs text-purple-400">Resonators</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* My Circles */}
              <Card className="bg-black/30 backdrop-blur-lg border-purple-500/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-purple-100 flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Sacred Circles
                    </CardTitle>
                    <Dialog open={isCreateCircleOpen} onOpenChange={setIsCreateCircleOpen}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-purple-300 hover:text-white hover:bg-purple-800/50">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gradient-to-br from-purple-900 to-indigo-900 border-purple-500/30">
                        <DialogHeader>
                          <DialogTitle className="text-purple-100">Manifest New Circle</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input
                            placeholder="Circle name..."
                            value={newCircleName}
                            onChange={(e) => setNewCircleName(e.target.value)}
                            className="bg-black/30 border-purple-500/30 text-purple-100 placeholder:text-purple-400"
                          />
                          <Textarea
                            placeholder="Circle description (optional)..."
                            value={newCircleDescription}
                            onChange={(e) => setNewCircleDescription(e.target.value)}
                            rows={3}
                            className="bg-black/30 border-purple-500/30 text-purple-100 placeholder:text-purple-400"
                          />
                          <Button
                            onClick={handleCreateCircle}
                            disabled={createCircleMutation.isPending}
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                          >
                            {createCircleMutation.isPending ? 'Manifesting...' : '✨ Create Sacred Circle'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {/* All Posts Option */}
                  <div
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                      !selectedCircle 
                        ? 'bg-purple-800/50 border border-purple-400/50 shadow-lg' 
                        : 'hover:bg-purple-800/30 border border-transparent'
                    }`}
                    onClick={() => setSelectedCircle(null)}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-pink-400" />
                      <span className="font-medium text-sm text-purple-100">All Transmissions</span>
                    </div>
                    <Badge variant="outline" className="text-xs border-purple-400 text-purple-300">
                      {posts?.total || 0}
                    </Badge>
                  </div>

                  {/* User's Circles */}
                  {circles?.circles.filter(circle => circle.is_member).map((circle) => (
                    <div
                      key={circle.id}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                        selectedCircle === circle.id 
                          ? 'bg-indigo-800/50 border border-indigo-400/50 shadow-lg' 
                          : 'hover:bg-purple-800/30 border border-transparent'
                      }`}
                      onClick={() => setSelectedCircle(circle.id)}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-indigo-400 to-cyan-400" />
                        <span className="font-medium text-sm text-purple-100">{circle.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Badge variant="outline" className="text-xs border-indigo-400 text-indigo-300">
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
                          className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/30"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  ))}
                  {!circles?.circles.some(circle => circle.is_member) && (
                    <p className="text-sm text-purple-400 text-center py-4">
                      No circles joined yet. Create or join one to begin.
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
              <Card className="bg-black/30 backdrop-blur-lg border-purple-500/30">
                <CardContent className="p-4">
                  <div className="flex space-x-3">
                    <Avatar className="w-10 h-10 ring-2 ring-purple-400/50">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                        {profile?.display_name?.charAt(0) || 'SS'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
                        <DialogTrigger asChild>
                          <div className="bg-purple-900/30 rounded-lg p-4 cursor-pointer hover:bg-purple-800/40 transition-all border border-purple-500/20 hover:border-purple-400/40">
                            <p className="text-purple-300">
                              {selectedCircleData 
                                ? `Share wisdom with ${selectedCircleData.name}...`
                                : 'Share your sacred insights with the network...'
                              }
                            </p>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl bg-gradient-to-br from-purple-900 to-indigo-900 border-purple-500/30">
                          <DialogHeader>
                            <DialogTitle className="text-purple-100 flex items-center">
                              <Sparkles className="w-5 h-5 mr-2" />
                              {selectedCircleData 
                                ? `Transmit to ${selectedCircleData.name}`
                                : 'Create Sacred Transmission'
                              }
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Textarea
                              placeholder="What sacred wisdom flows through you today?"
                              value={newPostContent}
                              onChange={(e) => setNewPostContent(e.target.value)}
                              rows={6}
                              className="resize-none bg-black/30 border-purple-500/30 text-purple-100 placeholder:text-purple-400"
                            />
                            <div className="flex items-center justify-between">
                              <Select value={newPostVisibility} onValueChange={(value: 'public' | 'followers' | 'private') => setNewPostVisibility(value)}>
                                <SelectTrigger className="w-40 bg-black/30 border-purple-500/30 text-purple-100">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-purple-900 border-purple-500/30">
                                  <SelectItem value="public" className="text-purple-100">🌍 Public</SelectItem>
                                  <SelectItem value="followers" className="text-purple-100">👥 Resonators</SelectItem>
                                  <SelectItem value="private" className="text-purple-100">🔒 Private</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                onClick={handleCreatePost}
                                disabled={createPostMutation.isPending}
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                              >
                                {createPostMutation.isPending ? 'Transmitting...' : '✨ Transmit'}
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
                <Card key={post.id} className="bg-black/30 backdrop-blur-lg border-purple-500/30 hover:border-purple-400/50 transition-all">
                  <CardContent className="p-6">
                    <div className="flex space-x-4">
                      <Avatar className="w-12 h-12 ring-2 ring-purple-400/50">
                        <AvatarImage src={post.author?.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                          {post.author?.display_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-purple-100">{post.author?.display_name}</p>
                            <p className="text-sm text-purple-400">@{post.author?.username}</p>
                            <p className="text-sm text-purple-500">•</p>
                            <p className="text-sm text-purple-400">{formatTimeAgo(post.created_at)}</p>
                            {post.visibility !== 'public' && (
                              <>
                                <p className="text-sm text-purple-500">•</p>
                                <Badge variant="outline" className="text-xs capitalize border-purple-400 text-purple-300">
                                  {post.visibility === 'followers' ? 'Resonators' : post.visibility}
                                </Badge>
                              </>
                            )}
                          </div>
                          <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-200">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-purple-100 leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>
                        
                        <div className="flex items-center justify-between text-purple-400 border-t border-purple-500/20 pt-4">
                          <div className="flex items-center space-x-6">
                            <button 
                              className={`flex items-center space-x-2 hover:text-pink-400 transition-colors group ${
                                post.is_liked ? 'text-pink-400' : ''
                              }`}
                              onClick={() => toggleLikeMutation.mutate(post.id)}
                            >
                              <Heart className={`w-5 h-5 group-hover:scale-110 transition-transform ${post.is_liked ? 'fill-current' : ''}`} />
                              <span className="text-sm font-medium">{post.like_count}</span>
                            </button>
                            <button 
                              className="flex items-center space-x-2 hover:text-blue-400 transition-colors group"
                              onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                            >
                              <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                              <span className="text-sm font-medium">{post.comment_count}</span>
                            </button>
                            <button className="flex items-center space-x-2 hover:text-green-400 transition-colors group">
                              <Share className="w-5 h-5 group-hover:scale-110 transition-transform" />
                              <span className="text-sm font-medium">Share</span>
                            </button>
                          </div>
                          <div className="flex items-center space-x-1 text-xs text-purple-500">
                            <Zap className="w-3 h-3" />
                            <span>Sacred Network</span>
                          </div>
                        </div>

                        {/* Comments Section */}
                        {expandedPost === post.id && (
                          <div className="mt-6 space-y-4 border-t border-purple-500/20 pt-4">
                            {/* Comment Input */}
                            <div className="flex space-x-3">
                              <Avatar className="w-8 h-8 ring-1 ring-purple-400/50">
                                <AvatarImage src={profile?.avatar_url} />
                                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs">
                                  {profile?.display_name?.charAt(0) || 'SS'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 flex space-x-2">
                                <Textarea
                                  placeholder="Share your reflection..."
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  className="min-h-[60px] bg-purple-900/30 border-purple-500/30 text-purple-100 placeholder:text-purple-400 text-sm resize-none"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleCreateComment(post.id);
                                    }
                                  }}
                                />
                                <Button
                                  onClick={() => handleCreateComment(post.id)}
                                  disabled={!newComment.trim() || createCommentMutation.isPending}
                                  size="sm"
                                  className="self-end bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                                >
                                  <Send className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Existing Comments Placeholder */}
                            <div className="text-center py-4">
                              <p className="text-purple-400 text-sm">Comments will appear here once the backend is connected</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {(!posts?.posts || posts.posts.length === 0) && (
                <Card className="bg-black/30 backdrop-blur-lg border-purple-500/30 border-dashed">
                  <CardContent className="text-center py-16">
                    <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-purple-100 mb-2">The Network Awaits</h3>
                    <p className="text-purple-400 mb-6">
                      {selectedCircleData 
                        ? `No transmissions in ${selectedCircleData.name} yet. Be the first to share sacred wisdom!`
                        : 'No transmissions yet. Begin sharing your sacred insights!'
                      }
                    </p>
                    <Button 
                      onClick={() => setIsCreatePostOpen(true)}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Create First Transmission
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="sticky top-24 space-y-6">
              {/* Network Stats */}
              <Card className="bg-black/30 backdrop-blur-lg border-purple-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-purple-100 flex items-center">
                    <Star className="w-4 h-4 mr-2" />
                    Network Resonance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-purple-400">Sacred Transmissions</span>
                    <span className="font-medium text-purple-200">{stats?.total_posts || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-purple-400">Conscious Beings</span>
                    <span className="font-medium text-purple-200">{stats?.total_users || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-purple-400">Sacred Circles</span>
                    <span className="font-medium text-purple-200">{stats?.total_circles || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-purple-400">Today's Flow</span>
                    <span className="font-medium text-purple-200">{stats?.posts_today || 0}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Discover Circles */}
              <Card className="bg-black/30 backdrop-blur-lg border-purple-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-purple-100 flex items-center">
                    <Eye className="w-4 h-4 mr-2" />
                    Discover Circles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {circles?.circles.filter(circle => !circle.is_member).slice(0, 5).map((circle) => (
                    <div key={circle.id} className="space-y-3 p-3 rounded-lg bg-purple-900/20 border border-purple-500/20">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-purple-100">{circle.name}</h4>
                          {circle.description && (
                            <p className="text-xs text-purple-400 line-clamp-2 mt-1">
                              {circle.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="outline" className="text-xs border-indigo-400 text-indigo-300">
                              <Users className="w-3 h-3 mr-1" />
                              {circle.member_count}
                            </Badge>
                            <Badge variant="outline" className="text-xs border-green-400 text-green-300">
                              Open Circle
                            </Badge>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => joinCircleMutation.mutate(circle.id)}
                          disabled={joinCircleMutation.isPending}
                          className="ml-2 border-purple-400 text-purple-300 hover:bg-purple-800/50 hover:text-white"
                        >
                          {joinCircleMutation.isPending ? 'Joining...' : 'Join'}
                        </Button>
                      </div>
                    </div>
                  ))}
                  {!circles?.circles.some(circle => !circle.is_member) && (
                    <p className="text-sm text-purple-400 text-center py-4">
                      All circles joined! You're fully connected.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Messages Button */}
      <Button
        className="fixed bottom-6 right-6 z-50 rounded-full w-16 h-16 shadow-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 border-2 border-purple-400/50"
        onClick={() => setIsMessengerOpen(true)}
      >
        <MessageCircle className="w-6 h-6" />
      </Button>

      <MessengerDrawer
        isOpen={isMessengerOpen}
        onClose={() => setIsMessengerOpen(false)}
      />
    </div>
  );
}
