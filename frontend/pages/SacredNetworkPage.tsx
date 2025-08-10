import { useState } from 'react';
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
import { useFeed } from '../hooks/useFeed';
import { useCircles } from '../hooks/useCircles';
import { defaultUser } from '../config';
import MessengerDrawer from '../components/messenger/MessengerDrawer';
import PostCard from '../components/sacred-network/PostCard';

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
  const { toast } = useToast();

  const { posts, loading: postsLoading, createPost, toggleReaction } = useFeed(selectedCircle || undefined);
  const { circles, myCircles, createCircle, joinCircle, leaveCircle } = useCircles();

  const handleCreatePost = () => {
    if (!newPostContent.trim()) {
      toast({
        title: "⚠️ Empty Transmission",
        description: "Please share your wisdom before transmitting.",
        variant: "destructive",
      });
      return;
    }

    createPost({
      content: newPostContent,
      visibility: newPostVisibility,
      circle_id: selectedCircle || undefined,
    });
    
    setNewPostContent('');
    setIsCreatePostOpen(false);
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

    createCircle({
      name: newCircleName,
      description: newCircleDescription || undefined,
      is_public: true,
    });
    
    setNewCircleName('');
    setNewCircleDescription('');
    setIsCreateCircleOpen(false);
  };

  const selectedCircleData = circles.find(c => c.id === selectedCircle);

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
                <AvatarImage src={defaultUser.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                  {defaultUser.display_name.charAt(0)}
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
                      <AvatarImage src={defaultUser.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                        {defaultUser.display_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-purple-100">{defaultUser.display_name}</p>
                      <p className="text-sm text-purple-300">@{defaultUser.username}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        {posts.length}
                      </p>
                      <p className="text-xs text-purple-400">Transmissions</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        0
                      </p>
                      <p className="text-xs text-purple-400">Following</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        0
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
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                          >
                            ✨ Create Sacred Circle
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
                      {posts.length}
                    </Badge>
                  </div>

                  {/* User's Circles */}
                  {myCircles.map((circle) => (
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
                            leaveCircle(circle.id);
                          }}
                          className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/30"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  ))}
                  {myCircles.length === 0 && (
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
                      <AvatarImage src={defaultUser.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                        {defaultUser.display_name.charAt(0)}
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
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                              >
                                ✨ Transmit
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
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onReaction={toggleReaction} />
              ))}

              {posts.length === 0 && (
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
                    <span className="font-medium text-purple-200">{posts.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-purple-400">Conscious Beings</span>
                    <span className="font-medium text-purple-200">1</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-purple-400">Sacred Circles</span>
                    <span className="font-medium text-purple-200">{circles.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-purple-400">Today's Flow</span>
                    <span className="font-medium text-purple-200">
                      {posts.filter(p => new Date(p.created_at).toDateString() === new Date().toDateString()).length}
                    </span>
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
                  {circles.filter(circle => !circle.is_member).slice(0, 5).map((circle) => (
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
                          onClick={() => joinCircle(circle.id)}
                          className="ml-2 border-purple-400 text-purple-300 hover:bg-purple-800/50 hover:text-white"
                        >
                          Join
                        </Button>
                      </div>
                    </div>
                  ))}
                  {circles.filter(circle => !circle.is_member).length === 0 && (
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
