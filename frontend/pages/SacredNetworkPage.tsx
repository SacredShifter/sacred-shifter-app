import { useState } from 'react';
import { Users, MessageCircle, Bell, Search, Menu, ArrowLeft, Plus, Heart, Share, MoreHorizontal, Eye, X, Send, Sparkles, Zap, Star, User } from 'lucide-react';
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
import { useQuery } from '@tanstack/react-query';
import backend from '~backend/client';
import { defaultUser } from '../config';
import MessengerDrawer from '../components/messenger/MessengerDrawer';
import PostCard from '../components/sacred-network/PostCard';
import NotificationsBell from '../components/sacred-network/NotificationsBell';
import UserProfile from '../components/sacred-network/UserProfile';
import { CallProvider } from '../contexts/CallContext';
import CallModal from '../components/messenger/CallModal';
import IncomingCallToast from '../components/messenger/IncomingCallToast';

export default function SacredNetworkPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostVisibility, setNewPostVisibility] = useState<'public' | 'followers' | 'private'>('public');
  const [newPostTags, setNewPostTags] = useState('');
  const [newPostLocation, setNewPostLocation] = useState('');
  const [newPostFeeling, setNewPostFeeling] = useState('');
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [newCircleName, setNewCircleName] = useState('');
  const [newCircleDescription, setNewCircleDescription] = useState('');
  const [isCreateCircleOpen, setIsCreateCircleOpen] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState<string | null>(null);
  const [isMessengerOpen, setIsMessengerOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'feed' | 'profile' | 'explore'>('feed');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const { posts, loading: postsLoading, createPost, toggleReaction } = useFeed(selectedCircle || undefined);
  const { circles, myCircles, createCircle, joinCircle, leaveCircle } = useCircles();

  // Get suggested users and trending profiles
  const { data: suggestedUsers } = useQuery({
    queryKey: ['suggested-follows'],
    queryFn: () => backend.social.getSuggestedFollows({ limit: 5 }),
  });

  const { data: trendingProfiles } = useQuery({
    queryKey: ['trending-profiles'],
    queryFn: () => backend.social.getTrendingProfiles({ limit: 5 }),
  });

  const { data: searchResults } = useQuery({
    queryKey: ['search-profiles', searchQuery],
    queryFn: () => backend.social.searchProfiles({ query: searchQuery, limit: 10 }),
    enabled: searchQuery.length > 2,
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

    const tags = newPostTags.split(',').map(tag => tag.trim()).filter(Boolean);

    createPost({
      content: newPostContent,
      visibility: newPostVisibility,
      circle_id: selectedCircle || undefined,
      tags,
      location: newPostLocation || undefined,
      feeling: newPostFeeling || undefined,
    });
    
    setNewPostContent('');
    setNewPostTags('');
    setNewPostLocation('');
    setNewPostFeeling('');
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

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setCurrentView('profile');
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
    <CallProvider>
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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-black/30 border-purple-500/30 text-purple-100 placeholder:text-purple-400 focus:border-purple-400"
                  />
                  {searchResults && searchResults.profiles.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-purple-900/95 backdrop-blur-lg border border-purple-500/30 rounded-lg shadow-xl z-50">
                      {searchResults.profiles.map((profile) => (
                        <div
                          key={profile.user_id}
                          onClick={() => {
                            handleUserClick(profile.user_id);
                            setSearchQuery('');
                          }}
                          className="flex items-center space-x-3 p-3 hover:bg-purple-800/50 cursor-pointer first:rounded-t-lg last:rounded-b-lg"
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={profile.avatar_url || undefined} />
                            <AvatarFallback className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs">
                              {profile.display_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-purple-100">{profile.display_name}</p>
                            <p className="text-xs text-purple-400">@{profile.username}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right side */}
              <div className="flex items-center space-x-3">
                <NotificationsBell />
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setCurrentView('explore')}
                  className="text-purple-200 hover:text-white hover:bg-purple-800/50"
                >
                  <Eye className="w-5 h-5" />
                </Button>
                
                <Avatar 
                  className="w-8 h-8 ring-2 ring-purple-400/50 cursor-pointer"
                  onClick={() => handleUserClick(defaultUser.id)}
                >
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
          {currentView === 'profile' && selectedUserId ? (
            <div className="space-y-6">
              <Button
                variant="ghost"
                onClick={() => setCurrentView('feed')}
                className="text-purple-200 hover:text-white hover:bg-purple-800/50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Feed
              </Button>
              <UserProfile 
                userId={selectedUserId} 
                isOwnProfile={selectedUserId === defaultUser.id}
              />
            </div>
          ) : currentView === 'explore' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-purple-100">Explore Sacred Network</h2>
                <Button
                  variant="ghost"
                  onClick={() => setCurrentView('feed')}
                  className="text-purple-200 hover:text-white hover:bg-purple-800/50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Feed
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Suggested Follows */}
                <Card className="bg-black/30 backdrop-blur-lg border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="text-purple-100">Suggested Sacred Beings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {suggestedUsers?.suggested_users.map((user) => (
                      <div key={user.user_id} className="flex items-center justify-between">
                        <div 
                          className="flex items-center space-x-3 cursor-pointer"
                          onClick={() => handleUserClick(user.user_id)}
                        >
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                              {user.display_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-purple-100">{user.display_name}</p>
                            <p className="text-xs text-purple-400">@{user.username}</p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-purple-400 text-purple-300 hover:bg-purple-800/50"
                        >
                          Follow
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Trending Profiles */}
                <Card className="bg-black/30 backdrop-blur-lg border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="text-purple-100">Trending Beings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {trendingProfiles?.profiles.map((user) => (
                      <div key={user.user_id} className="flex items-center justify-between">
                        <div 
                          className="flex items-center space-x-3 cursor-pointer"
                          onClick={() => handleUserClick(user.user_id)}
                        >
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                              {user.display_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-purple-100">{user.display_name}</p>
                            <p className="text-xs text-purple-400">@{user.username}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {user.follower_count} Resonators
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="bg-black/30 backdrop-blur-lg border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="text-purple-100">My Circles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {myCircles.map((circle) => (
                        <li key={circle.id}>
                          <Button
                            variant="ghost"
                            onClick={() => setSelectedCircle(circle.id)}
                            className={`w-full justify-start ${selectedCircle === circle.id ? 'bg-purple-800/50 text-white' : 'text-purple-200 hover:bg-purple-800/50'}`}
                          >
                            <Users className="w-4 h-4 mr-2" />
                            {circle.name}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Main Feed */}
              <div className="lg:col-span-2 space-y-6">
                <div className="space-y-4">
                  {posts.map((post) => (
                    <PostCard 
                      key={post.id} 
                      post={post} 
                      onReaction={toggleReaction}
                    />
                  ))}
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="bg-black/30 backdrop-blur-lg border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="text-purple-100">Messenger</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600"
                      onClick={() => setIsMessengerOpen(true)}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Open Messenger
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
        <MessengerDrawer isOpen={isMessengerOpen} onClose={() => setIsMessengerOpen(false)} />
        <CallModal />
        <IncomingCallToast />
      </div>
    </CallProvider>
  );
}
