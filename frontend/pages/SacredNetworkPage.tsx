import { useState } from 'react';
import { Users, MessageCircle, Bell, Search, Menu, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

export default function SacredNetworkPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const mockPosts = [
    {
      id: 1,
      author: 'Sacred Seeker',
      content: 'Just had an incredible meditation session with the new quantum frequencies. The resonance was off the charts! 🌟',
      timestamp: '2 hours ago',
      likes: 12,
      comments: 3
    },
    {
      id: 2,
      author: 'Consciousness Explorer',
      content: 'Synchronicity alert: Saw 11:11, 2:22, and 3:33 all in the same day. The universe is definitely speaking! What patterns are you noticing?',
      timestamp: '4 hours ago',
      likes: 8,
      comments: 7
    },
    {
      id: 3,
      author: 'Dream Walker',
      content: 'Last night\'s lucid dream was incredible. I was able to maintain awareness for over 20 minutes and explore the astral realm. Anyone else working on dream consciousness?',
      timestamp: '6 hours ago',
      likes: 15,
      comments: 5
    }
  ];

  const mockCircles = [
    { name: 'Quantum Consciousness', members: 24, active: true },
    { name: 'Dream Explorers', members: 18, active: false },
    { name: 'Sacred Geometry', members: 31, active: true },
    { name: 'Frequency Healers', members: 42, active: false }
  ];

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
                <AvatarFallback>SS</AvatarFallback>
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
                      <AvatarFallback>SS</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">Sacred Seeker</p>
                      <p className="text-sm text-gray-500">Consciousness Explorer</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-purple-600">42</p>
                      <p className="text-xs text-gray-500">Posts</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-purple-600">128</p>
                      <p className="text-xs text-gray-500">Connections</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-purple-600">7</p>
                      <p className="text-xs text-gray-500">Circles</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* My Circles */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">My Circles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {mockCircles.map((circle, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${circle.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="font-medium text-sm">{circle.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        {circle.members}
                      </Badge>
                    </div>
                  ))}
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
                      <AvatarFallback>SS</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-lg p-3 cursor-pointer hover:bg-gray-200 transition-colors">
                        <p className="text-gray-500">Share your spiritual insights with the Sacred Network...</p>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm" className="text-purple-600">
                            📸 Photo
                          </Button>
                          <Button variant="ghost" size="sm" className="text-purple-600">
                            🎵 Audio
                          </Button>
                          <Button variant="ghost" size="sm" className="text-purple-600">
                            🔮 Vision
                          </Button>
                        </div>
                        <Button className="bg-purple-600 hover:bg-purple-700">
                          Share
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Feed Posts */}
              {mockPosts.map((post) => (
                <Card key={post.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>{post.author.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <p className="font-medium text-gray-900">{post.author}</p>
                          <p className="text-sm text-gray-500">{post.timestamp}</p>
                        </div>
                        <p className="text-gray-800 leading-relaxed mb-4">{post.content}</p>
                        
                        <div className="flex items-center space-x-6 text-gray-500">
                          <button className="flex items-center space-x-1 hover:text-red-500 transition-colors">
                            <span>❤️</span>
                            <span className="text-sm">{post.likes}</span>
                          </button>
                          <button className="flex items-center space-x-1 hover:text-blue-500 transition-colors">
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-sm">{post.comments}</span>
                          </button>
                          <button className="flex items-center space-x-1 hover:text-green-500 transition-colors">
                            <span>🔄</span>
                            <span className="text-sm">Share</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="sticky top-24 space-y-6">
              {/* Online Members */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Online Now</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <div className="relative">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>U{i}</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                      <span className="text-sm text-gray-700">Seeker {i}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Trending Topics */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Trending</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { tag: '#consciousness', posts: 42 },
                    { tag: '#meditation', posts: 38 },
                    { tag: '#synchronicity', posts: 29 },
                    { tag: '#awakening', posts: 24 },
                    { tag: '#quantumfield', posts: 18 }
                  ].map((item) => (
                    <div key={item.tag} className="flex items-center justify-between p-2 rounded-lg hover:bg-purple-50 cursor-pointer">
                      <span className="text-sm text-purple-600 font-medium">{item.tag}</span>
                      <span className="text-xs text-gray-500">{item.posts} posts</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Suggested Connections */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Suggested Connections</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {['Quantum Mystic', 'Dream Weaver', 'Light Worker'].map((name, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>{name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{name}</span>
                      </div>
                      <Button size="sm" variant="outline" className="text-xs">
                        Connect
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Messages Button */}
      <Button
        className="fixed bottom-4 right-4 z-50 rounded-full w-14 h-14 shadow-lg bg-purple-600 hover:bg-purple-700"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    </div>
  );
}
