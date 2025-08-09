import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Plus, Edit, Trash2, Save, X, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { journalClient } from '../lib/moduleClient';
import { useModuleStatus } from '../hooks/useModuleHealth';
import ModuleHealthIndicator from '../components/ModuleHealthIndicator';
import AIAssistant from '../components/AIAssistant';

export default function JournalPage() {
  const [newEntryTitle, setNewEntryTitle] = useState('');
  const [newEntryContent, setNewEntryContent] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isHealthy, isDegraded } = useModuleStatus('journal');

  const { data: journalEntries, isLoading, error } = useQuery({
    queryKey: ['journal-entries'],
    queryFn: () => journalClient.listEntries(),
    enabled: isHealthy || isDegraded, // Only fetch if module is at least partially working
  });

  const createEntryMutation = useMutation({
    mutationFn: (data: { title: string; content: string }) =>
      journalClient.createEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      setNewEntryTitle('');
      setNewEntryContent('');
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Your journal entry has been saved.",
      });
    },
    onError: (error) => {
      console.error('Failed to create journal entry:', error);
      toast({
        title: "Error",
        description: "Failed to save your journal entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateEntryMutation = useMutation({
    mutationFn: (data: { id: string; title: string; content: string }) =>
      journalClient.updateEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      setEditingEntry(null);
      toast({
        title: "Success",
        description: "Your journal entry has been updated.",
      });
    },
    onError: (error) => {
      console.error('Failed to update journal entry:', error);
      toast({
        title: "Error",
        description: "Failed to update your journal entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: (id: string) => journalClient.deleteEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      toast({
        title: "Success",
        description: "Your journal entry has been deleted.",
      });
    },
    onError: (error) => {
      console.error('Failed to delete journal entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete your journal entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateEntry = () => {
    if (!newEntryTitle.trim() || !newEntryContent.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both title and content.",
        variant: "destructive",
      });
      return;
    }

    createEntryMutation.mutate({
      title: newEntryTitle,
      content: newEntryContent,
    });
  };

  const handleEditEntry = (entry: any) => {
    setEditingEntry(entry);
    setEditTitle(entry.title);
    setEditContent(entry.content);
  };

  const handleUpdateEntry = () => {
    if (!editingEntry || !editTitle.trim() || !editContent.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both title and content.",
        variant: "destructive",
      });
      return;
    }

    updateEntryMutation.mutate({
      id: editingEntry.id,
      title: editTitle,
      content: editContent,
    });
  };

  const handleDeleteEntry = (id: string) => {
    if (confirm('Are you sure you want to delete this journal entry?')) {
      deleteEntryMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const journalContextData = {
    entries_count: journalEntries?.entries.length || 0,
    recent_entries: journalEntries?.entries.slice(0, 3).map(entry => ({
      title: entry.title,
      content: entry.content.substring(0, 200) + '...',
      date: entry.created_at
    })) || []
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Personal Journal
          </h1>
          <ModuleHealthIndicator moduleName="journal" showLabel size="md" />
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Document your spiritual journey, insights, and reflections in your private sacred space.
        </p>
      </div>

      {/* Module Status Alert */}
      {!isHealthy && (
        <Alert variant={isDegraded ? "default" : "destructive"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {isDegraded 
              ? "Journal module is experiencing some issues. Some features may be limited."
              : "Journal module is currently unavailable. Please try again later."
            }
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Your Entries</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              disabled={!isHealthy && !isDegraded}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Journal Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Entry title..."
                value={newEntryTitle}
                onChange={(e) => setNewEntryTitle(e.target.value)}
              />
              <Textarea
                placeholder="Write your thoughts, insights, and reflections..."
                value={newEntryContent}
                onChange={(e) => setNewEntryContent(e.target.value)}
                rows={10}
              />
              <Button
                onClick={handleCreateEntry}
                disabled={createEntryMutation.isPending}
                className="w-full"
              >
                {createEntryMutation.isPending ? 'Saving...' : 'Save Entry'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {journalEntries?.entries.map((entry) => (
          <Card key={entry.id} className="border-green-200 hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">{entry.title}</CardTitle>
                  <CardDescription>
                    {new Date(entry.created_at).toLocaleDateString()}
                    {entry.updated_at !== entry.created_at && (
                      <span className="ml-2 text-xs">(edited)</span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditEntry(entry)}
                    disabled={!isHealthy && !isDegraded}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteEntry(entry.id)}
                    disabled={!isHealthy && !isDegraded}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed line-clamp-4">{entry.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!journalEntries?.entries || journalEntries.entries.length === 0) && (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No journal entries yet</h3>
            <p className="text-gray-500 text-center mb-4">
              Start documenting your spiritual journey by creating your first entry.
            </p>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              disabled={!isHealthy && !isDegraded}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Entry
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Edit Journal Entry
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingEntry(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Entry title..."
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
            <Textarea
              placeholder="Write your thoughts, insights, and reflections..."
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={10}
            />
            <div className="flex space-x-2">
              <Button
                onClick={handleUpdateEntry}
                disabled={updateEntryMutation.isPending}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateEntryMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditingEntry(null)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AIAssistant 
        contextType="journal" 
        contextData={journalContextData}
        className="bottom-4 left-4"
      />
    </div>
  );
}
