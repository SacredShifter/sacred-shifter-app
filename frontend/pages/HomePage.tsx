import { useQuery } from '@tanstack/react-query';
import { Sparkles, Users, BookOpen, Heart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBackend } from '../contexts/AuthContext';
import { useAuth } from '../contexts/AuthContext';
import AIAssistant from '../components/AIAssistant';

export default function HomePage() {
  const { user } = useAuth();
  const backend = useBackend();

  const { data: echoGlyphs } = useQuery({
    queryKey: ['echo-glyphs'],
    queryFn: () => backend.echo_glyphs.list(),
  });

  const { data: sharedLearnings } = useQuery({
    queryKey: ['shared-learnings'],
    queryFn: () => backend.community.listSharedLearnings(),
  });

  const { data: journalEntries } = useQuery({
    queryKey: ['journal-entries'],
    queryFn: () => backend.journal.listEntries(),
  });

  const { data: meditationAnalytics } = useQuery({
    queryKey: ['meditation-analytics'],
    queryFn: () => backend.meditation.getAnalytics(),
  });

  const homeContextData = {
    user: {
      username: user?.username,
      email: user?.email
    },
    overview: {
      echo_glyphs_count: echoGlyphs?.glyphs.length || 0,
      community_posts_count: sharedLearnings?.learnings.length || 0,
      journal_entries_count: journalEntries?.entries.length || 0,
      meditation_sessions: meditationAnalytics?.completed_sessions || 0
    },
    recent_activity: {
      recent_glyphs: echoGlyphs?.glyphs.slice(0, 3).map(g => g.name) || [],
      recent_learnings: sharedLearnings?.learnings.slice(0, 3).map(l => l.title) || [],
      recent_entries: journalEntries?.entries.slice(0, 3).map(e => e.title) || []
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
          Welcome to Sacred Shifter, {user?.username}
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Your metaphysical operating system for consciousness elevation, community connection, and spiritual growth.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Echo Glyphs</CardTitle>
            <Sparkles className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">
              {echoGlyphs?.glyphs.length || 0}
            </div>
            <p className="text-xs text-gray-600">
              Resonance patterns discovered
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Community Posts</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {sharedLearnings?.learnings.length || 0}
            </div>
            <p className="text-xs text-gray-600">
              Shared wisdom entries
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Journal Entries</CardTitle>
            <BookOpen className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {journalEntries?.entries.length || 0}
            </div>
            <p className="text-xs text-gray-600">
              Personal reflections
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consciousness</CardTitle>
            <Heart className="h-4 w-4 text-pink-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-700">
              Expanding
            </div>
            <p className="text-xs text-gray-600">
              Your spiritual journey
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
              Recent Echo Glyphs
            </CardTitle>
            <CardDescription>
              Latest resonance patterns in the collective consciousness
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {echoGlyphs?.glyphs.slice(0, 3).map((glyph) => (
                <div key={glyph.id} className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{glyph.name}</p>
                    <p className="text-sm text-gray-500">{glyph.resonance_type}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              Community Wisdom
            </CardTitle>
            <CardDescription>
              Recent insights shared by the community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sharedLearnings?.learnings.slice(0, 3).map((learning) => (
                <div key={learning.id} className="space-y-2">
                  <p className="font-medium text-gray-900">{learning.title}</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{learning.content}</p>
                  <p className="text-xs text-gray-500">by {learning.username}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <AIAssistant 
        contextType="general" 
        contextData={homeContextData}
        className="bottom-4 left-4"
      />
    </div>
  );
}
