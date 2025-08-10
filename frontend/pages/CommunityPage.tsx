import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, MessageCircle, Plus, Send, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';
import { useModuleStatus } from '../hooks/useModuleHealth';
import ModuleHealthIndicator from '../components/ModuleHealthIndicator';
import AIAssistant from '../components/AIAssistant';

export default function CommunityPage() {
  const [newLearningTitle, setNewLearningTitle] = useState('');
  const [newLearningContent, setNewLearningContent] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isHealthy, isDegraded } = useModuleStatus('community');

  const { data: sharedLearnings, isLoading } = useQuery({
    queryKey: ['shared-learnings'],
    queryFn: () => backend.community.listSharedLearnings(),
    enabled: isHealthy || isDegraded,
  });

  const { data: messages } = useQuery({
    queryKey: ['messages'],
    queryFn: () => backend.community.listMessages(),
    enabled: isHealthy || isDegraded,
  });

  const createLearningMutation = useMutation({
    mutationFn: (data: { title: string; content: string }) =>
      backend.community.createSharedLearning(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-learnings'] });
      setNewLearningTitle('');
      setNewLearningContent('');
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Your learning has been shared with the community.",
      });
    },
    onError: (error) => {
      console.error('Failed to create shared learning:', error);
      toast({
        title: "Error",
        description: "Failed to share your learning. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateLearning = () => {
    if (!newLearningTitle.trim() || !newLearningContent.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both title and content.",
        variant: "destructive",
      });
      return;
    }

    createLearningMutation.mutate({
      title: newLearningTitle,
      content: newLearningContent,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const communityContextData = {
    shared_learnings_count: sharedLearnings?.learnings.length || 0,
    messages_count: messages?.messages.length || 0,
    recent_learnings: sharedLearnings?.learnings.slice(0, 3).map(learning => ({
      title: learning.title,
      content: learning.content.substring(0, 200) + '...',
      username: learning.username,
      date: learning.created_at
    })) || [],
    recent_messages: messages?.messages.slice(0, 3).map(message => ({
      content: message.content.substring(0, 100) + '...',
      sender: message.sender_username,
      date: message.created_at
    })) || []
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Community & Connection Hub
          </h1>
          <ModuleHealthIndicator moduleName="community" showLabel size="md" />
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Share your insights, connect with fellow seekers, and grow together in consciousness.
        </p>
      </div>

      {/* Module Status Alert */}
      {!isHealthy && (
        <Alert variant={isDegraded ? "default" : "destructive"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {isDegraded 
              ? "Community module is experiencing some issues. Some features may be limited."
              : "Community module is currently unavailable. Please try again later."
            }
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Shared Learnings</h2>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={!isHealthy && !isDegraded}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Share Learning
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share Your Learning</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Title of your insight..."
                    value={newLearningTitle}
                    onChange={(e) => setNewLearningTitle(e.target.value)}
                  />
                  <Textarea
                    placeholder="Share your wisdom with the community..."
                    value={newLearningContent}
                    onChange={(e) => setNewLearningContent(e.target.value)}
                    rows={6}
                  />
                  <Button
                    onClick={handleCreateLearning}
                    disabled={createLearningMutation.isPending}
                    className="w-full"
                  >
                    {createLearningMutation.isPending ? 'Sharing...' : 'Share Learning'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {sharedLearnings?.learnings.map((learning) => (
              <Card key={learning.id} className="border-blue-200 hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{learning.title}</CardTitle>
                  <CardDescription>
                    by {learning.username} • {new Date(learning.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{learning.content}</p>
                </CardContent>
              </Card>
            ))}
            
            {(!sharedLearnings?.learnings || sharedLearnings.learnings.length === 0) && (
              <Card className="border-dashed border-2 border-blue-300 bg-blue-50">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Users className="w-16 h-16 text-blue-400 mb-4" />
                  <h3 className="text-xl font-medium text-blue-900 mb-2">No Shared Learnings Yet</h3>
                  <p className="text-blue-600 text-center mb-6 max-w-md">
                    Be the first to share your wisdom and insights with the Sacred Shifter community.
                  </p>
                  <Button 
                    onClick={() => setIsCreateDialogOpen(true)} 
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={!isHealthy && !isDegraded}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Share First Learning
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="w-5 h-5 mr-2 text-green-600" />
                Messages
              </CardTitle>
              <CardDescription>
                Recent conversations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {messages?.messages.slice(0, 5).map((message) => (
                  <div key={message.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900">
                        {message.sender_username}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(message.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{message.content}</p>
                  </div>
                ))}
                {(!messages?.messages || messages.messages.length === 0) && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No messages yet. Start a conversation!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-purple-600" />
                Community Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Shared Learnings</span>
                  <span className="font-medium">{sharedLearnings?.learnings.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Messages</span>
                  <span className="font-medium">{messages?.messages.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active Seekers</span>
                  <span className="font-medium">Growing</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AIAssistant 
        contextType="community" 
        contextData={communityContextData}
        className="bottom-4 left-4"
      />
    </div>
  );
}
