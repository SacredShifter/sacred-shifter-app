import { useQuery } from '@tanstack/react-query';
import { Rss, Users, BookOpen, Database, Brain, Play, Book, Heart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import backend from '~backend/client';
import AIAssistant from '../components/AIAssistant';
import ModuleHealthIndicator from '../components/ModuleHealthIndicator';

const modules = [
  {
    title: 'Sacred Feed',
    description: 'Your personalized stream of consciousness transformation content',
    icon: Rss,
    href: '/feed',
    action: 'Feed the Flame Within',
    gradient: 'from-purple-500 to-indigo-600',
    module: 'community'
  },
  {
    title: 'Sacred Circles',
    description: 'Connect with fellow seekers in transformative group experiences',
    icon: Users,
    href: '/circles',
    action: 'Step Into the Shared Field',
    gradient: 'from-blue-500 to-cyan-600',
    module: 'community'
  },
  {
    title: 'Mirror Journal',
    description: 'Reflect, record, and analyze your inner journey',
    icon: BookOpen,
    href: '/journal',
    action: 'Witness Your Soul Unfold',
    gradient: 'from-green-500 to-emerald-600',
    module: 'journal'
  },
  {
    title: 'Resonant Codex',
    description: 'Unified space for insights, synchronicities, and measurable resonance',
    icon: Database,
    href: '/codex',
    action: 'Anchor the Synchronicities',
    gradient: 'from-purple-600 to-pink-600',
    module: 'codex'
  },
  {
    title: 'Meditation Center',
    description: 'Track your meditation journey and deepen your practice',
    icon: Brain,
    href: '/meditation',
    action: 'Expand Your Awareness',
    gradient: 'from-indigo-500 to-purple-600',
    module: 'meditation'
  },
  {
    title: 'YouTube Library',
    description: 'Curated video content for consciousness expansion',
    icon: Play,
    href: '/youtube',
    action: 'Expand Your Awareness',
    gradient: 'from-red-500 to-orange-600'
  },
  {
    title: 'Sacred Shifter Guidebook',
    description: 'Ancient wisdom for modern transformation',
    icon: Book,
    href: '/guidebook',
    action: 'Access the Wisdom',
    gradient: 'from-indigo-500 to-purple-600'
  },
  {
    title: 'Support Sacred Shifter',
    description: 'Fuel the frequency with donations and premium modules',
    icon: Heart,
    href: '/support',
    action: 'Amplify the Mission',
    gradient: 'from-pink-500 to-rose-600'
  }
];

export default function HomePage() {
  const { data: journalEntries } = useQuery({
    queryKey: ['journal-entries'],
    queryFn: () => backend.journal.listEntries(),
  });

  const { data: meditationAnalytics } = useQuery({
    queryKey: ['meditation-analytics'],
    queryFn: () => backend.meditation.getAnalytics(),
  });

  const { data: codexEntries } = useQuery({
    queryKey: ['codex-entries'],
    queryFn: () => backend.codex.listEntries(),
  });

  const { data: communityLearnings } = useQuery({
    queryKey: ['shared-learnings'],
    queryFn: () => backend.community.listSharedLearnings(),
  });

  const homeContextData = {
    user: {
      username: "Sacred Seeker",
      email: "seeker@sacred-shifter.app"
    },
    overview: {
      journal_entries_count: journalEntries?.entries.length || 0,
      meditation_sessions: meditationAnalytics?.completed_sessions || 0,
      codex_entries_count: codexEntries?.entries.length || 0,
      community_learnings: communityLearnings?.learnings.length || 0
    },
    recent_activity: {
      recent_entries: journalEntries?.entries.slice(0, 3).map(e => e.title) || [],
      recent_codex: codexEntries?.entries.slice(0, 3).map(e => e.title) || []
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="relative">
        {/* Header */}
        <div className="text-center py-16 px-4">
          <div className="mb-8">
            <div className="inline-flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">SS</span>
              </div>
              <h1 className="text-4xl font-bold text-white">
                Sacred Shifter
              </h1>
            </div>
            <p className="text-xl text-purple-200 max-w-2xl mx-auto">
              Your consciousness transformation toolkit
            </p>
            <p className="text-sm text-purple-300 mt-2">
              Welcome, Sacred Seeker
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{journalEntries?.entries.length || 0}</div>
              <div className="text-sm text-purple-200">Journal Entries</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{meditationAnalytics?.completed_sessions || 0}</div>
              <div className="text-sm text-purple-200">Meditations</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{codexEntries?.entries.length || 0}</div>
              <div className="text-sm text-purple-200">Codex Entries</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{communityLearnings?.learnings.length || 0}</div>
              <div className="text-sm text-purple-200">Shared Learnings</div>
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="px-8 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {modules.map((module, index) => (
              <Card 
                key={module.title} 
                className="group relative overflow-hidden border-0 bg-white/10 backdrop-blur-lg hover:bg-white/20 transition-all duration-300 cursor-pointer"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${module.gradient} opacity-20 group-hover:opacity-30 transition-opacity`} />
                <CardHeader className="relative z-10 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-white/20">
                      <module.icon className="w-6 h-6 text-white" />
                    </div>
                    {'module' in module && (
                      <ModuleHealthIndicator moduleName={module.module} />
                    )}
                  </div>
                  <CardTitle className="text-lg text-white group-hover:text-purple-100 transition-colors">
                    {module.title}
                  </CardTitle>
                  <CardDescription className="text-purple-200 text-sm leading-relaxed">
                    {module.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10 pt-0">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                    onClick={() => window.location.href = module.href}
                  >
                    {module.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pb-8 px-4">
          <p className="text-purple-300 text-sm">
            Ancient wisdom for modern transformation. Your comprehensive guide to consciousness expansion and sacred technology integration.
          </p>
          <p className="text-purple-400 text-xs mt-2">
            Version 1.0 - Living Document
          </p>
        </div>
      </div>

      <AIAssistant 
        contextType="general" 
        contextData={homeContextData}
        className="bottom-4 left-4"
      />
    </div>
  );
}
