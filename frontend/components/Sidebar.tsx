import { Link, useLocation } from 'react-router-dom';
import { Home, Rss, Users, BookOpen, Brain, Database, Play, Book, User, Heart, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';

const coreNavigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Feed', href: '/feed', icon: Rss },
  { name: 'Messages', href: '/messages', icon: Users },
];

const sacredTools = [
  { name: 'Journal', href: '/journal', icon: BookOpen },
  { name: 'Circles', href: '/circles', icon: Users },
  { name: 'Resonance Register', href: '/resonance-register', icon: Database },
  { name: 'Personal Codex', href: '/personal-codex', icon: Brain },
];

const media = [
  { name: 'YouTube', href: '/youtube', icon: Play },
];

const knowledge = [
  { name: 'Guidebook', href: '/guidebook', icon: Book },
];

const account = [
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Support the Shift', href: '/support', icon: Heart },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const renderNavSection = (title: string, items: typeof coreNavigation) => (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-4">
        {title}
      </h3>
      <nav className="space-y-1 px-2">
        {items.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                  : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
              }`}
            >
              <item.icon className="w-4 h-4 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white/95 backdrop-blur-lg border-r border-purple-200 shadow-lg">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center h-16 px-4 border-b border-purple-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SS</span>
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Sacred Shifter
            </h1>
          </div>
        </div>
        
        <div className="flex-1 py-6 overflow-y-auto">
          {renderNavSection('Core Navigation', coreNavigation)}
          {renderNavSection('Sacred Tools', sacredTools)}
          {renderNavSection('Media', media)}
          {renderNavSection('Knowledge', knowledge)}
          {renderNavSection('Account', account)}
        </div>

        <div className="p-4 border-t border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm">
              <p className="font-medium text-gray-900">{user?.username}</p>
              <p className="text-gray-500 text-xs">{user?.email}</p>
            </div>
          </div>
          <Button
            onClick={logout}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
