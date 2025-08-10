import { Link, useLocation } from 'react-router-dom';
import { Home, Rss, Users, BookOpen, Brain, Database, Play, Book, User, Heart, Settings, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ModuleHealthIndicator from './ModuleHealthIndicator';

const coreNavigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Feed', href: '/feed', icon: Rss, module: 'community' },
  { name: 'Community', href: '/community', icon: Users, module: 'community' },
  { name: 'Sacred Network', href: '/network', icon: Network },
];

const sacredTools = [
  { name: 'Journal', href: '/journal', icon: BookOpen, module: 'journal' },
  { name: 'Circles', href: '/circles', icon: Users, module: 'community' },
  { name: 'Codex', href: '/codex', icon: Database, module: 'codex' },
  { name: 'Meditation', href: '/meditation', icon: Brain, module: 'meditation' },
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
              className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                  : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
              }`}
            >
              <div className="flex items-center">
                <item.icon className="w-4 h-4 mr-3" />
                {item.name}
              </div>
              {'module' in item && (
                <ModuleHealthIndicator moduleName={item.module} />
              )}
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
              <p className="font-medium text-gray-900">Sacred Seeker</p>
              <p className="text-gray-500 text-xs">Welcome to Sacred Shifter</p>
            </div>
          </div>
          
          {/* System Health Summary */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>System Status</span>
            <div className="flex items-center space-x-1">
              <ModuleHealthIndicator moduleName="journal" />
              <ModuleHealthIndicator moduleName="meditation" />
              <ModuleHealthIndicator moduleName="community" />
              <ModuleHealthIndicator moduleName="ai" />
              <ModuleHealthIndicator moduleName="codex" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
