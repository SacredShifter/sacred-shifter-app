import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Database, Plus, Calendar, Tag, Search, Filter, Star, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useBackend } from '../contexts/AuthContext';
import AIAssistant from '../components/AIAssistant';

interface ResonanceEntry {
  id: string;
  title: string;
  description: string;
  type: 'synchronicity' | 'vision' | 'dream' | 'meditation' | 'manifestation' | 'sign';
  intensity: number;
  tags: string[];
  date: Date;
  location?: string;
  connections: string[];
}

const mockEntries: ResonanceEntry[] = [
  {
    id: '1',
    title: 'Triple Number Sequence - 333',
    description: 'Saw 333 on clock, receipt total, and license plate within 2 hours. Felt strong pull toward new creative project.',
    type: 'synchronicity',
    intensity: 8,
    tags: ['numbers', 'creativity', 'guidance'],
    date: new Date('2024-01-10'),
    location: 'Downtown',
    connections: ['Creative breakthrough', 'New project idea']
  },
  {
    id: '2',
    title: 'Meditation Vision - Golden Light',
    description: 'During morning meditation, experienced vivid vision of golden light emanating from heart center, expanding to encompass entire room.',
    type: 'meditation',
    intensity: 9,
    tags: ['light', 'heart chakra', 'expansion'],
    date: new Date('2024-01-08'),
    connections: ['Heart opening', 'Energy work']
  },
  {
    id: '3',
    title: 'Dream of Flying Over Sacred Geometry',
    description: 'Lucid dream where I was flying over a landscape made entirely of interconnected sacred geometric patterns. Felt profound sense of unity.',
    type: 'dream',
    intensity: 10,
    tags: ['flying', 'sacred geometry', 'unity'],
    date: new Date('2024-01-05'),
    connections: ['Sacred geometry study', 'Unity consciousness']
  }
];

export default function ResonanceRegisterPage() {
  const [entries, setEntries] = useState<ResonanceEntry[]>(mockEntries);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    title: '',
    description: '',
    type: 'synchronicity' as ResonanceEntry['type'],
    intensity: 5,
    tags: '',
    location: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const { toast } = useToast();

  const handleCreateEntry = () => {
    if (!newEntry.title.trim() || !newEntry.description.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both title and description.",
        variant: "destructive",
      });
      return;
    }

    const entry: ResonanceEntry = {
      id: Date.now().toString(),
      title: newEntry.title,
      description: newEntry.description,
      type: newEntry.type,
      intensity: newEntry.intensity,
      tags: newEntry.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      date: new Date(),
      location: newEntry.location || undefined,
      connections: []
    };

    setEntries(prev => [entry, ...prev]);
    setNewEntry({
      title: '',
      description: '',
      type: 'synchronicity',
      intensity: 5,
      tags: '',
      location: ''
    });
    setIsCreateDialogOpen(false);

    toast({
      title: "Success",
      description: "Synchronicity anchored in your Resonance Register.",
    });
  };

  const getTypeIcon = (type: ResonanceEntry['type']) => {
    switch (type) {
      case 'synchronicity': return <Zap className="w-4 h-4" />;
      case 'vision': return <Star className="w-4 h-4" />;
      case 'dream': return <Calendar className="w-4 h-4" />;
      case 'meditation': return <Database className="w-4 h-4" />;
      case 'manifestation': return <Star className="w-4 h-4" />;
      case 'sign': return <Zap className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: ResonanceEntry['type']) => {
    switch (type) {
      case 'synchronicity': return 'bg-purple-100 text-purple-800';
      case 'vision': return 'bg-yellow-100 text-yellow-800';
      case 'dream': return 'bg-blue-100 text-blue-800';
      case 'meditation': return 'bg-green-100 text-green-800';
      case 'manifestation': return 'bg-pink-100 text-pink-800';
      case 'sign': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 8) return 'text-red-600';
    if (intensity >= 6) return 'text-orange-600';
    if (intensity >= 4) return 'text-yellow-600';
    return 'text-green-600';
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || entry.type === filterType;
    return matchesSearch && matchesType;
  });

  const resonanceContextData = {
    total_entries: entries.length,
    entry_types: [...new Set(entries.map(e => e.type))],
    recent_entries: entries.slice(0, 3).map(entry => ({
      title: entry.title,
      type: entry.type,
      intensity: entry.intensity,
      date: entry.date
    })),
    high_intensity_count: entries.filter(e => e.intensity >= 8).length
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
          Resonance Register
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Document meaningful synchronicities and spiritual experiences. Anchor the synchronicities that guide your path.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 gap-4 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search synchronicities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="synchronicity">Synchronicity</SelectItem>
              <SelectItem value="vision">Vision</SelectItem>
              <SelectItem value="dream">Dream</SelectItem>
              <SelectItem value="meditation">Meditation</SelectItem>
              <SelectItem value="manifestation">Manifestation</SelectItem>
              <SelectItem value="sign">Sign</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="w-4 h-4 mr-2" />
              Record Experience
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Record Spiritual Experience</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Experience title..."
                value={newEntry.title}
                onChange={(e) => setNewEntry(prev => ({ ...prev, title: e.target.value }))}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <Select 
                  value={newEntry.type} 
                  onValueChange={(value) => setNewEntry(prev => ({ ...prev, type: value as ResonanceEntry['type'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="synchronicity">Synchronicity</SelectItem>
                    <SelectItem value="vision">Vision</SelectItem>
                    <SelectItem value="dream">Dream</SelectItem>
                    <SelectItem value="meditation">Meditation</SelectItem>
                    <SelectItem value="manifestation">Manifestation</SelectItem>
                    <SelectItem value="sign">Sign</SelectItem>
                  </SelectContent>
                </Select>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Intensity (1-10)</label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={newEntry.intensity}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, intensity: parseInt(e.target.value) || 5 }))}
                  />
                </div>
              </div>

              <Input
                placeholder="Location (optional)..."
                value={newEntry.location}
                onChange={(e) => setNewEntry(prev => ({ ...prev, location: e.target.value }))}
              />

              <Input
                placeholder="Tags (comma separated)..."
                value={newEntry.tags}
                onChange={(e) => setNewEntry(prev => ({ ...prev, tags: e.target.value }))}
              />

              <Textarea
                placeholder="Describe your experience in detail..."
                value={newEntry.description}
                onChange={(e) => setNewEntry(prev => ({ ...prev, description: e.target.value }))}
                rows={6}
              />

              <Button onClick={handleCreateEntry} className="w-full">
                Anchor Experience
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Experiences</p>
                <p className="text-2xl font-bold text-orange-600">{entries.length}</p>
              </div>
              <Database className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Intensity</p>
                <p className="text-2xl font-bold text-red-600">
                  {entries.filter(e => e.intensity >= 8).length}
                </p>
              </div>
              <Zap className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-blue-600">
                  {entries.filter(e => new Date(e.date).getMonth() === new Date().getMonth()).length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unique Tags</p>
                <p className="text-2xl font-bold text-green-600">
                  {new Set(entries.flatMap(e => e.tags)).size}
                </p>
              </div>
              <Tag className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Entries */}
      <div className="space-y-4">
        {filteredEntries.map((entry) => (
          <Card key={entry.id} className="border-orange-200 hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge className={getTypeColor(entry.type)}>
                      {getTypeIcon(entry.type)}
                      <span className="ml-1 capitalize">{entry.type}</span>
                    </Badge>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">Intensity:</span>
                      <span className={`font-bold ${getIntensityColor(entry.intensity)}`}>
                        {entry.intensity}/10
                      </span>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{entry.title}</CardTitle>
                  <CardDescription className="flex items-center space-x-4 mt-1">
                    <span>{entry.date.toLocaleDateString()}</span>
                    {entry.location && (
                      <>
                        <span>•</span>
                        <span>{entry.location}</span>
                      </>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed mb-4">{entry.description}</p>
              
              {entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {entry.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {entry.connections.length > 0 && (
                <div className="bg-orange-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-orange-900 mb-2">Connections:</p>
                  <ul className="text-sm text-orange-700 space-y-1">
                    {entry.connections.map((connection, index) => (
                      <li key={index}>• {connection}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEntries.length === 0 && (
        <Card className="border-dashed border-2 border-orange-300 bg-orange-50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Database className="w-16 h-16 text-orange-400 mb-4" />
            <h3 className="text-xl font-medium text-orange-900 mb-2">No Experiences Found</h3>
            <p className="text-orange-600 text-center mb-6 max-w-md">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Begin documenting your synchronicities and spiritual experiences to build your resonance register.'
              }
            </p>
            {!searchTerm && filterType === 'all' && (
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-orange-600 hover:bg-orange-700">
                <Plus className="w-4 h-4 mr-2" />
                Record First Experience
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <AIAssistant 
        contextType="echo_glyphs" 
        contextData={resonanceContextData}
        className="bottom-4 left-4"
      />
    </div>
  );
}
