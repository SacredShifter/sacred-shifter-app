import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Rss, Plus, Heart, MessageCircle, Share, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useBackend } from '../contexts/AuthContext';
import AIAssistant from '../components/AIAssistant';

export default function FeedPage() {
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('insight');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const backend = useBackend();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sharedLearnings, isLoading } = useQuery({
    queryKey: ['shared-learnings'],
    queryFn: () => backend.community.listSharedLearnings(),
  });

  const createPostMutation = useMutation({
    mutationFn: (data: { title: string; content: string }) =>
      backend.community.createSharedLearning(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-learnings'] });
      setNewPostContent('');
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Your insight has been shared with the Sacred Feed.",
      });
    },
    onError: (error) => {
      console.error('Failed to create post:', error);
      toast({
        title: "Error",
        description: "Failed to share your insight. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreatePost = () => {
    if (!newPostContent.trim()) {
      toast({
        title: "Error",
        description: "Please write your insight before sharing.",
        variant: "destructive",
      });
      return;
    }

    const title = newPostContent.length > 50 ? newPostContent.substring(0, 50) + "..." : newPostContent;
    
    createPostMutation.mutate({
      title,
      content: newPostContent,
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'insight': return 'bg-purple-100 text-purple-800';
      case 'synchronicity': return 'bg-blue-100 text-blue-800';
      case 'meditation': return 'bg-green-100 text-green-800';
      case 'dream': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const feedContextData = {
    posts_count: sharedLearnings?.learnings.length || 0,
    recent_posts: sharedLearnings?.learnings.slice(0, 3).map(learning => ({
      title: learning.title,
      content: learning.content.substring(0, 200) + '...',
      username: learning.username,
      date: learning.created_at
    })) || []
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
          Sacred Feed
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Your personalized stream of consciousness transformation content. Feed the flame within.
        </p>
      </div>

      {/* Feed Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="insight">Insights</SelectItem>
              <SelectItem value="synchronicity">Synchronicities</SelectItem>
              <SelectItem value="meditation">Meditation</SelectItem>
              <SelectItem value="dream">Dreams</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Share Insight
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Share Your Sacred Insight</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Select value={newPostCategory} onValueChange={setNewPostCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="insight">Spiritual Insight</SelectItem>
                  <SelectItem value="synchronicity">Synchronicity</SelectItem>
                  <SelectItem value="meditation">Meditation Experience</SelectItem>
                  <SelectItem value="dream">Dream Vision</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Share your wisdom, insights, synchronicities, or spiritual experiences with the community..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                rows={8}
                className="resize-none"
              />
              <Button
                onClick={handleCreatePost}
                disabled={createPostMutation.isPending}
                className="w-full"
              >
                {createPostMutation.isPending ? 'Sharing...' : 'Share with Sacred Feed'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Feed Posts */}
      <div className="space-y-6">
        {sharedLearnings?.learnings.map((learning) => (
          <Card key={learning.id} className="border-purple-200 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {learning.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{learning.username}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(learning.created_at).toLocaleDateString()} • 
                      {new Date(learning.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <Badge className={getCategoryColor('insight')}>
                  Insight
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {learning.content}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-500">
                      <Heart className="w-4 h-4 mr-1" />
                      Resonate
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-500">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Reflect
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-green-500">
                      <Share className="w-4 h-4 mr-1" />
                      Share
                    </Button>
                  </div>
                  <div className="text-xs text-gray-400">
                    Sacred Feed • Consciousness Stream
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!sharedLearnings?.learnings || sharedLearnings.learnings.length === 0) && (
        <Card className="border-dashed border-2 border-purple-300 bg-purple-50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Rss className="w-16 h-16 text-purple-400 mb-4" />
            <h3 className="text-xl font-medium text-purple-900 mb-2">Your Sacred Feed Awaits</h3>
            <p className="text-purple-600 text-center mb-6 max-w-md">
              Begin sharing your spiritual insights, synchronicities, and transformative experiences to feed the collective flame.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Share Your First Insight
            </Button>
          </CardContent>
        </Card>
      )}

      <AIAssistant 
        contextType="community" 
        contextData={feedContextData}
        className="bottom-4 left-4"
      />
    </div>
  );
}
