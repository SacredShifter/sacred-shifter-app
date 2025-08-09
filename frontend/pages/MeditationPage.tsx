import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Brain, Clock, TrendingUp, Calendar, BarChart3, Play, Pause } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useBackend } from '../contexts/AuthContext';
import { useMeditation } from '../contexts/MeditationContext';
import AIAssistant from '../components/AIAssistant';

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m ${secs}s`;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function MeditationPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');
  const backend = useBackend();
  const { currentSession, sessionDuration, isPlaying, startMeditationSession, endMeditationSession } = useMeditation();

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['meditation-sessions'],
    queryFn: () => backend.meditation.listSessions(),
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['meditation-analytics'],
    queryFn: () => backend.meditation.getAnalytics(),
  });

  const hasActiveSession = currentSession && !currentSession.completed;

  const handleQuickStart = async (soundscape: string) => {
    if (hasActiveSession) {
      await endMeditationSession();
    } else {
      await startMeditationSession(soundscape);
    }
  };

  if (sessionsLoading || analyticsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const quickStartSoundscapes = [
    { id: 'forest', name: 'Forest', color: 'bg-green-500' },
    { id: 'ocean', name: 'Ocean', color: 'bg-blue-500' },
    { id: 'rain', name: 'Rain', color: 'bg-gray-500' },
    { id: 'tibetan', name: 'Tibetan', color: 'bg-orange-500' },
  ];

  const meditationContextData = {
    current_session: hasActiveSession ? {
      soundscape: currentSession.soundscape,
      duration: sessionDuration,
      is_active: true
    } : null,
    analytics: {
      total_sessions: analytics?.completed_sessions || 0,
      total_time: analytics?.total_meditation_time || 0,
      current_streak: analytics?.current_streak || 0,
      favorite_soundscape: analytics?.favorite_soundscape
    },
    recent_sessions: sessions?.sessions.slice(0, 3).map(session => ({
      soundscape: session.soundscape,
      duration: session.duration_seconds,
      completed: session.completed,
      date: session.started_at
    })) || []
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
          Meditation Center
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Track your meditation journey, analyze your progress, and deepen your practice.
        </p>
      </div>

      {/* Active Session Card */}
      {hasActiveSession && (
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center text-green-800">
              <Brain className="w-5 h-5 mr-2" />
              Active Meditation Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-mono font-bold text-green-700">
                  {formatTime(sessionDuration)}
                </p>
                <p className="text-sm text-green-600">
                  {currentSession.soundscape.replace('_', ' ')} soundscape
                </p>
              </div>
              <Button
                onClick={() => endMeditationSession()}
                className="bg-green-600 hover:bg-green-700"
              >
                End Session
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
          <CardDescription>Begin a meditation session with your favorite soundscape</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickStartSoundscapes.map((soundscape) => (
              <Button
                key={soundscape.id}
                variant="outline"
                onClick={() => handleQuickStart(soundscape.id)}
                className="h-16 flex flex-col items-center justify-center space-y-1"
                disabled={!!hasActiveSession}
              >
                <div className={`w-4 h-4 rounded-full ${soundscape.color}`}></div>
                <span className="text-sm">{soundscape.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.completed_sessions || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.total_sessions || 0} started
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(analytics?.total_meditation_time || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg: {formatDuration(analytics?.average_session_duration || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.current_streak || 0}</div>
            <p className="text-xs text-muted-foreground">
              Best: {analytics?.longest_streak || 0} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.sessions_this_week || 0}</div>
            <p className="text-xs text-muted-foreground">
              This month: {analytics?.sessions_this_month || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Soundscape Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Soundscape Preferences</CardTitle>
            <CardDescription>Your meditation soundscape usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.soundscape_breakdown.map((item, index) => (
                <div key={item.soundscape} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">
                      {item.soundscape.replace('_', ' ')}
                    </span>
                    <div className="text-right">
                      <div className="text-sm font-medium">{item.count} sessions</div>
                      <div className="text-xs text-gray-500">
                        {formatDuration(item.total_duration)}
                      </div>
                    </div>
                  </div>
                  <Progress 
                    value={(item.count / (analytics?.completed_sessions || 1)) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
            <CardDescription>Your latest meditation sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sessions?.sessions.slice(0, 5).map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium capitalize">
                      {session.soundscape.replace('_', ' ')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(session.started_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={session.completed ? "default" : "secondary"}>
                      {session.completed ? "Completed" : "Incomplete"}
                    </Badge>
                    {session.duration_seconds && (
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDuration(session.duration_seconds)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {(!sessions?.sessions || sessions.sessions.length === 0) && (
                <p className="text-center text-gray-500 py-4">
                  No meditation sessions yet. Start your first session above!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Progress Chart */}
      {analytics?.weekly_progress && analytics.weekly_progress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Progress</CardTitle>
            <CardDescription>Your meditation activity over the past weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.weekly_progress.map((week, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Week of {new Date(week.week_start).toLocaleDateString()}
                    </span>
                    <div className="text-right">
                      <div className="text-sm font-medium">{week.session_count} sessions</div>
                      <div className="text-xs text-gray-500">
                        {formatDuration(week.total_duration)}
                      </div>
                    </div>
                  </div>
                  <Progress 
                    value={Math.min((week.session_count / 7) * 100, 100)} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AIAssistant 
        contextType="meditation" 
        contextData={meditationContextData}
        className="bottom-4 left-4"
      />
    </div>
  );
}
