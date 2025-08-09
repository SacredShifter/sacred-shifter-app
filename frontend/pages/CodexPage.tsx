import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Database, Plus, Edit, Trash2, Save, X, AlertCircle, Search, Filter, Star, Zap, Eye, Share, Calendar, Tag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';
import { useModuleStatus } from '../hooks/useModuleHealth';
import ModuleHealthIndicator from '../components/ModuleHealthIndicator';
import AIAssistant from '../components/AIAssistant';
import type { CodexEntry, CreateCodexEntryRequest, CodexContent } from '~backend/codex/entries';

export default function CodexPage() {
  const [activeTab, setActiveTab] = useState('timeline');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CodexEntry | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<CodexEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'codex' | 'register'>('all');
  const [filterType, setFilterType] = useState('all');
  const [resonanceRange, setResonanceRange] = useState([0, 1]);
  
  const [newEntry, setNewEntry] = useState<{
    mode: 'codex' | 'register';
    title: string;
    content: CodexContent;
    entry_type: string;
    tags: string;
    resonance_rating?: number;
    resonance_signature: string;
    resonance_channels: string;
    occurred_at?: string;
    visibility: 'private' | 'shared' | 'public';
  }>({
    mode: 'codex',
    title: '',
    content: { body: '', highlights: [], attachments: [], metrics: {}, prompts: [], links: [] },
    entry_type: 'insight',
    tags: '',
    resonance_rating: 0.5,
    resonance_signature: '',
    resonance_channels: '',
    visibility: 'private'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isHealthy, isDegraded } = useModuleStatus('codex');

  const { data: entries, isLoading, error } = useQuery({
    queryKey: ['codex-entries', searchTerm, filterMode, filterType],
    queryFn: () => backend.codex.listEntries({
      search: searchTerm || undefined,
      mode: filterMode === 'all' ? undefined : filterMode,
      entry_type: filterType === 'all' ? undefined : filterType,
      limit: 100
    }),
    enabled: isHealthy || isDegraded,
  });

  const { data: analytics } = useQuery({
    queryKey: ['codex-analytics'],
    queryFn: () => backend.codex.getAnalytics(),
    enabled: isHealthy || isDegraded,
  });

  const createEntryMutation = useMutation({
    mutationFn: (data: CreateCodexEntryRequest) => backend.codex.createEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['codex-entries'] });
      queryClient.invalidateQueries({ queryKey: ['codex-analytics'] });
      resetNewEntry();
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Your entry has been saved to the Codex.",
      });
    },
    onError: (error) => {
      console.error('Failed to create codex entry:', error);
      toast({
        title: "Error",
        description: "Failed to save your entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateEntryMutation = useMutation({
    mutationFn: (data: { id: string; [key: string]: any }) => backend.codex.updateEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['codex-entries'] });
      setEditingEntry(null);
      toast({
        title: "Success",
        description: "Your entry has been updated.",
      });
    },
    onError: (error) => {
      console.error('Failed to update codex entry:', error);
      toast({
        title: "Error",
        description: "Failed to update your entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: (id: string) => backend.codex.deleteEntry({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['codex-entries'] });
      queryClient.invalidateQueries({ queryKey: ['codex-analytics'] });
      toast({
        title: "Success",
        description: "Your entry has been deleted.",
      });
    },
    onError: (error) => {
      console.error('Failed to delete codex entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete your entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetNewEntry = () => {
    setNewEntry({
      mode: 'codex',
      title: '',
      content: { body: '', highlights: [], attachments: [], metrics: {}, prompts: [], links: [] },
      entry_type: 'insight',
      tags: '',
      resonance_rating: 0.5,
      resonance_signature: '',
      resonance_channels: '',
      visibility: 'private'
    });
  };

  const handleCreateEntry = () => {
    if (!newEntry.title.trim() || !newEntry.content.body.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both title and content.",
        variant: "destructive",
      });
      return;
    }

    const entryData: CreateCodexEntryRequest = {
      mode: newEntry.mode,
      title: newEntry.title,
      content: newEntry.content,
      entry_type: newEntry.entry_type,
      tags: newEntry.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      visibility: newEntry.visibility,
    };

    if (newEntry.mode === 'register') {
      entryData.resonance_rating = newEntry.resonance_rating;
      entryData.resonance_signature = newEntry.resonance_signature || undefined;
      entryData.resonance_channels = newEntry.resonance_channels.split(',').map(c => c.trim()).filter(Boolean);
      entryData.occurred_at = newEntry.occurred_at ? new Date(newEntry.occurred_at) : new Date();
    }

    createEntryMutation.mutate(entryData);
  };

  const handleDeleteEntry = (id: string) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      deleteEntryMutation.mutate(id);
    }
  };

  const getModeColor = (mode: 'codex' | 'register') => {
    return mode === 'codex' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'synchronicity': return <Zap className="w-4 h-4" />;
      case 'vision': return <Eye className="w-4 h-4" />;
      case 'insight': return <Star className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  const getResonanceColor = (rating?: number) => {
    if (!rating) return 'text-gray-400';
    if (rating >= 0.8) return 'text-red-600';
    if (rating >= 0.6) return 'text-orange-600';
    if (rating >= 0.4) return 'text-yellow-600';
    return 'text-green-600';
  };

  const filteredEntries = entries?.entries.filter(entry => {
    if (filterMode !== 'all' && entry.mode !== filterMode) return false;
    if (filterType !== 'all' && entry.entry_type !== filterType) return false;
    if (entry.resonance_rating !== undefined && entry.resonance_rating !== null) {
      if (entry.resonance_rating < resonanceRange[0] || entry.resonance_rating > resonanceRange[1]) {
        return false;
      }
    }
    return true;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const codexContextData = {
    total_entries: analytics?.total_entries || 0,
    codex_entries: analytics?.codex_entries || 0,
    register_entries: analytics?.register_entries || 0,
    recent_entries: filteredEntries.slice(0, 3).map(entry => ({
      title: entry.title,
      mode: entry.mode,
      type: entry.entry_type,
      resonance: entry.resonance_rating,
      date: entry.created_at
    })),
    analytics: analytics
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Resonant Codex
          </h1>
          <ModuleHealthIndicator moduleName="codex" showLabel size="md" />
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Your unified space for insights, synchronicities, and measurable resonance. Private by default, shareable when chosen.
        </p>
      </div>

      {/* Module Status Alert */}
      {!isHealthy && (
        <Alert variant={isDegraded ? "default" : "destructive"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {isDegraded 
              ? "Codex module is experiencing some issues. Some features may be limited."
              : "Codex module is currently unavailable. Please try again later."
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Entries</p>
                  <p className="text-2xl font-bold text-purple-600">{analytics.total_entries}</p>
                </div>
                <Database className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Codex Notes</p>
                  <p className="text-2xl font-bold text-blue-600">{analytics.codex_entries}</p>
                </div>
                <Star className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Register Events</p>
                  <p className="text-2xl font-bold text-purple-600">{analytics.register_entries}</p>
                </div>
                <Zap className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Resonance</p>
                  <p className="text-2xl font-bold text-orange-600">{analytics.average_resonance.toFixed(2)}</p>
                </div>
                <Tag className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="register">Register Map</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-purple-600 hover:bg-purple-700"
                disabled={!isHealthy && !isDegraded}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Mode Selection */}
                <div className="flex items-center space-x-4">
                  <Label>Mode:</Label>
                  <div className="flex space-x-2">
                    <Button
                      variant={newEntry.mode === 'codex' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNewEntry(prev => ({ ...prev, mode: 'codex' }))}
                    >
                      Codex Note
                    </Button>
                    <Button
                      variant={newEntry.mode === 'register' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNewEntry(prev => ({ ...prev, mode: 'register' }))}
                    >
                      Register Event
                    </Button>
                  </div>
                </div>

                {/* Basic Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Entry title..."
                    value={newEntry.title}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, title: e.target.value }))}
                  />
                  <Select 
                    value={newEntry.entry_type} 
                    onValueChange={(value) => setNewEntry(prev => ({ ...prev, entry_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="insight">Insight</SelectItem>
                      <SelectItem value="practice">Practice</SelectItem>
                      <SelectItem value="synchronicity">Synchronicity</SelectItem>
                      <SelectItem value="vision">Vision</SelectItem>
                      <SelectItem value="dream">Dream</SelectItem>
                      <SelectItem value="analysis">Analysis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Content */}
                <Textarea
                  placeholder="Write your entry content..."
                  value={newEntry.content.body}
                  onChange={(e) => setNewEntry(prev => ({ 
                    ...prev, 
                    content: { ...prev.content, body: e.target.value }
                  }))}
                  rows={8}
                />

                {/* Tags and Visibility */}
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Tags (comma separated)..."
                    value={newEntry.tags}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, tags: e.target.value }))}
                  />
                  <Select 
                    value={newEntry.visibility} 
                    onValueChange={(value: 'private' | 'shared' | 'public') => 
                      setNewEntry(prev => ({ ...prev, visibility: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="shared">Shared</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Resonance Fields (Register Mode Only) */}
                {newEntry.mode === 'register' && (
                  <div className="space-y-4 p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-900">Resonance Data</h4>
                    
                    <div className="space-y-2">
                      <Label>Resonance Rating: {newEntry.resonance_rating?.toFixed(2)}</Label>
                      <Slider
                        value={[newEntry.resonance_rating || 0.5]}
                        onValueChange={(value) => setNewEntry(prev => ({ ...prev, resonance_rating: value[0] }))}
                        max={1}
                        min={0}
                        step={0.01}
                        className="w-full"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder="Resonance signature (e.g., Sol-528:A3)..."
                        value={newEntry.resonance_signature}
                        onChange={(e) => setNewEntry(prev => ({ ...prev, resonance_signature: e.target.value }))}
                      />
                      <Input
                        placeholder="Channels (vision, sound, somatic)..."
                        value={newEntry.resonance_channels}
                        onChange={(e) => setNewEntry(prev => ({ ...prev, resonance_channels: e.target.value }))}
                      />
                    </div>

                    <Input
                      type="datetime-local"
                      value={newEntry.occurred_at}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, occurred_at: e.target.value }))}
                    />
                  </div>
                )}

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

        <TabsContent value="timeline" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterMode} onValueChange={(value: 'all' | 'codex' | 'register') => setFilterMode(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                <SelectItem value="codex">Codex Only</SelectItem>
                <SelectItem value="register">Register Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="insight">Insights</SelectItem>
                <SelectItem value="synchronicity">Synchronicities</SelectItem>
                <SelectItem value="vision">Visions</SelectItem>
                <SelectItem value="dream">Dreams</SelectItem>
                <SelectItem value="practice">Practices</SelectItem>
                <SelectItem value="analysis">Analysis</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Entries List */}
          <div className="space-y-4">
            {filteredEntries.map((entry) => (
              <Card key={entry.id} className="border-purple-200 hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className={getModeColor(entry.mode)}>
                          {entry.mode}
                        </Badge>
                        {entry.entry_type && (
                          <Badge variant="outline" className="flex items-center">
                            {getTypeIcon(entry.entry_type)}
                            <span className="ml-1 capitalize">{entry.entry_type}</span>
                          </Badge>
                        )}
                        {entry.resonance_rating !== undefined && (
                          <Badge variant="outline" className={getResonanceColor(entry.resonance_rating)}>
                            {(entry.resonance_rating * 100).toFixed(0)}%
                          </Badge>
                        )}
                        <Badge variant="outline" className="capitalize">
                          {entry.visibility}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{entry.title}</CardTitle>
                      <CardDescription>
                        {entry.mode === 'register' && entry.occurred_at 
                          ? new Date(entry.occurred_at).toLocaleDateString()
                          : new Date(entry.created_at).toLocaleDateString()
                        }
                        {entry.resonance_signature && (
                          <span className="ml-2 font-mono text-xs">
                            {entry.resonance_signature}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedEntry(entry)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingEntry(entry)}
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
                  <p className="text-gray-700 leading-relaxed line-clamp-3">
                    {entry.content.body}
                  </p>
                  
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {entry.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {entry.ai_summary && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>AI Summary:</strong> {entry.ai_summary}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredEntries.length === 0 && (
            <Card className="border-dashed border-2 border-purple-300 bg-purple-50">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Database className="w-16 h-16 text-purple-400 mb-4" />
                <h3 className="text-xl font-medium text-purple-900 mb-2">No Entries Found</h3>
                <p className="text-purple-600 text-center mb-6 max-w-md">
                  {searchTerm || filterMode !== 'all' || filterType !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Begin documenting your insights and synchronicities in your Resonant Codex.'
                  }
                </p>
                {!searchTerm && filterMode === 'all' && filterType === 'all' && (
                  <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Entry
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="register" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Register Map View</CardTitle>
              <CardDescription>
                Temporal and resonance visualization of your register entries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredEntries
                  .filter(entry => entry.mode === 'register')
                  .sort((a, b) => {
                    const dateA = new Date(a.occurred_at || a.created_at).getTime();
                    const dateB = new Date(b.occurred_at || b.created_at).getTime();
                    return dateB - dateA;
                  })
                  .map((entry) => (
                    <div key={entry.id} className="flex items-center space-x-4 p-4 bg-purple-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div 
                          className={`w-4 h-4 rounded-full ${getResonanceColor(entry.resonance_rating)}`}
                          style={{ 
                            backgroundColor: entry.resonance_rating 
                              ? `hsl(${(1 - entry.resonance_rating) * 120}, 70%, 50%)`
                              : '#gray'
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{entry.title}</h4>
                        <p className="text-sm text-gray-600">
                          {entry.occurred_at 
                            ? new Date(entry.occurred_at).toLocaleString()
                            : new Date(entry.created_at).toLocaleString()
                          }
                        </p>
                        {entry.resonance_signature && (
                          <p className="text-xs font-mono text-purple-600">
                            {entry.resonance_signature}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${getResonanceColor(entry.resonance_rating)}`}>
                          {entry.resonance_rating ? (entry.resonance_rating * 100).toFixed(0) + '%' : 'N/A'}
                        </p>
                        {entry.resonance_channels && entry.resonance_channels.length > 0 && (
                          <p className="text-xs text-gray-500">
                            {entry.resonance_channels.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Entry Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.entry_types.map((type, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">{type.type}</span>
                          <span className="text-sm text-gray-500">{type.count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ width: `${(type.count / analytics.total_entries) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resonance Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.resonance_distribution.map((range, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{range.range}</span>
                          <span className="text-sm text-gray-500">{range.count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-orange-600 h-2 rounded-full" 
                            style={{ width: `${(range.count / analytics.total_entries) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Most Common Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analytics.most_common_tags.slice(0, 20).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag.tag} ({tag.count})
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Activity Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">This Week</span>
                      <span className="font-medium">{analytics.entries_this_week}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">This Month</span>
                      <span className="font-medium">{analytics.entries_this_month}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Verified Entries</span>
                      <span className="font-medium">{analytics.verified_entries}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Shared Entries</span>
                      <span className="font-medium">{analytics.shared_entries}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Entry Detail Dialog */}
      <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedEntry?.title}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedEntry(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {selectedEntry && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <Badge className={getModeColor(selectedEntry.mode)}>
                  {selectedEntry.mode}
                </Badge>
                {selectedEntry.entry_type && (
                  <Badge variant="outline">
                    {selectedEntry.entry_type}
                  </Badge>
                )}
                {selectedEntry.resonance_rating !== undefined && (
                  <Badge variant="outline" className={getResonanceColor(selectedEntry.resonance_rating)}>
                    Resonance: {(selectedEntry.resonance_rating * 100).toFixed(0)}%
                  </Badge>
                )}
              </div>

              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{selectedEntry.content.body}</p>
              </div>

              {selectedEntry.tags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedEntry.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedEntry.mode === 'register' && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-medium text-purple-900 mb-3">Resonance Data</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedEntry.resonance_signature && (
                      <div>
                        <span className="text-gray-600">Signature:</span>
                        <p className="font-mono">{selectedEntry.resonance_signature}</p>
                      </div>
                    )}
                    {selectedEntry.resonance_channels && selectedEntry.resonance_channels.length > 0 && (
                      <div>
                        <span className="text-gray-600">Channels:</span>
                        <p>{selectedEntry.resonance_channels.join(', ')}</p>
                      </div>
                    )}
                    {selectedEntry.occurred_at && (
                      <div>
                        <span className="text-gray-600">Occurred:</span>
                        <p>{new Date(selectedEntry.occurred_at).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedEntry.ai_summary && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">AI Summary</h4>
                  <p className="text-blue-800">{selectedEntry.ai_summary}</p>
                </div>
              )}

              {selectedEntry.ai_labels.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">AI Labels</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedEntry.ai_labels.map((label, index) => (
                      <Badge key={index} variant="secondary">
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AIAssistant 
        contextType="codex" 
        contextData={codexContextData}
        className="bottom-4 left-4"
      />
    </div>
  );
}
