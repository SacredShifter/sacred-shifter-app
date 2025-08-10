import { useState } from 'react'
import { Users, MessageCircle, Bell, Search, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Feed from '../components/sacred-network/Feed'
import CircleList from '../components/sacred-network/CircleList'
import MessagesDrawer from '../components/sacred-network/MessagesDrawer'
import NotificationsBell from '../components/sacred-network/NotificationsBell'

export default function SacredNetworkPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side */}
            <div className="flex items-center space-x-4">
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
              <NotificationsBell />
              
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
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback>SS</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">Sacred Seeker</p>
                    <p className="text-sm text-gray-500">Consciousness Explorer</p>
                  </div>
                </div>
              </div>

              {/* Circles */}
              <CircleList />
            </div>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-2">
            <Feed />
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="sticky top-24 space-y-6">
              {/* Online Members */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-3">Online Now</h3>
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <div className="relative">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>U{i}</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                      <span className="text-sm text-gray-700">User {i}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trending Topics */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-3">Trending</h3>
                <div className="space-y-2">
                  {['#consciousness', '#meditation', '#synchronicity', '#awakening'].map((tag) => (
                    <div key={tag} className="text-sm text-purple-600 hover:text-purple-700 cursor-pointer">
                      {tag}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Drawer */}
      <MessagesDrawer />
    </div>
  )
}
