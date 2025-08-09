import { useState } from 'react';
import { Users, Plus, Calendar, MapPin, Clock, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AIAssistant from '../components/AIAssistant';

const circles = [
  {
    id: 1,
    name: 'Quantum Consciousness Collective',
    description: 'Exploring the intersection of quantum physics and consciousness expansion through group meditation and discussion.',
    members: 24,
    type: 'Study Circle',
    frequency: 'Weekly',
    nextMeeting: '2024-01-15T19:00:00',
    location: 'Virtual',
    tags: ['Quantum Physics', 'Meditation', 'Consciousness'],
    level: 'Intermediate'
  },
  {
    id: 2,
    name: 'Sacred Geometry Practitioners',
    description: 'Hands-on exploration of sacred geometric patterns and their applications in spiritual practice.',
    members: 18,
    type: 'Practice Circle',
    frequency: 'Bi-weekly',
    nextMeeting: '2024-01-18T18:30:00',
    location: 'Hybrid',
    tags: ['Sacred Geometry', 'Art', 'Manifestation'],
    level: 'Beginner'
  },
  {
    id: 3,
    name: 'Dream Weavers Alliance',
    description: 'Sharing and interpreting dreams, lucid dreaming techniques, and exploring the collective unconscious.',
    members: 31,
    type: 'Sharing Circle',
    frequency: 'Monthly',
    nextMeeting: '2024-01-22T20:00:00',
    location: 'Virtual',
    tags: ['Dreams', 'Lucid Dreaming', 'Jung'],
    level: 'All Levels'
  },
  {
    id: 4,
    name: 'Frequency Healers Network',
    description: 'Sound healing, frequency therapy, and vibrational medicine practitioners sharing knowledge and techniques.',
    members: 42,
    type: 'Healing Circle',
    frequency: 'Weekly',
    nextMeeting: '2024-01-16T17:00:00',
    location: 'In-Person',
    tags: ['Sound Healing', 'Frequencies', 'Energy Work'],
    level: 'Advanced'
  }
];

export default function CirclesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCircleName, setNewCircleName] = useState('');
  const [newCircleDescription, setNewCircleDescription] = useState('');
  const [newCircleType, setNewCircleType] = useState('');

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Study Circle': return 'bg-purple-100 text-purple-800';
      case 'Practice Circle': return 'bg-indigo-100 text-indigo-800';
      case 'Sharing Circle': return 'bg-pink-100 text-pink-800';
      case 'Healing Circle': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const circlesContextData = {
    total_circles: circles.length,
    circle_types: [...new Set(circles.map(c => c.type))],
    upcoming_meetings: circles.map(circle => ({
      name: circle.name,
      date: circle.nextMeeting,
      members: circle.members
    }))
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-4">
          Sacred Circles
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Connect with fellow seekers in transformative group experiences. Step into the shared field of consciousness.
        </p>
      </div>

      {/* Circles Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">Active Circles</h2>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {circles.length} Communities
          </Badge>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Circle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Sacred Circle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Circle name..."
                value={newCircleName}
                onChange={(e) => setNewCircleName(e.target.value)}
              />
              <Select value={newCircleType} onValueChange={setNewCircleType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select circle type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="study">Study Circle</SelectItem>
                  <SelectItem value="practice">Practice Circle</SelectItem>
                  <SelectItem value="sharing">Sharing Circle</SelectItem>
                  <SelectItem value="healing">Healing Circle</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Describe the purpose and focus of your circle..."
                value={newCircleDescription}
                onChange={(e) => setNewCircleDescription(e.target.value)}
                rows={6}
              />
              <Button className="w-full">
                Create Sacred Circle
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Circles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {circles.map((circle) => (
          <Card key={circle.id} className="border-blue-200 hover:shadow-lg transition-all duration-300 group">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                    {circle.name}
                  </CardTitle>
                  <CardDescription className="mt-2 leading-relaxed">
                    {circle.description}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <Badge className={getTypeColor(circle.type)}>
                    {circle.type}
                  </Badge>
                  <Badge className={getLevelColor(circle.level)}>
                    {circle.level}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Circle Stats */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {circle.members} members
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {circle.frequency}
                  </div>
                </div>

                {/* Next Meeting */}
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Next Gathering</p>
                      <div className="flex items-center text-sm text-blue-700 mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(circle.nextMeeting).toLocaleDateString()} at{' '}
                        {new Date(circle.nextMeeting).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="flex items-center text-sm text-blue-700 mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {circle.location}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                      Join
                    </Button>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {circle.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    View Details
                  </Button>
                  <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                    Join Circle
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Featured Section */}
      <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center text-yellow-800">
            <Star className="w-5 h-5 mr-2" />
            Featured Circle of the Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Quantum Consciousness Collective
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Join us for a deep dive into the quantum nature of consciousness. This week we're exploring the observer effect 
                and its implications for reality creation. Perfect for those ready to bridge science and spirituality.
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Next: Monday 7:00 PM</span>
                <span>•</span>
                <span>Virtual Meeting</span>
                <span>•</span>
                <span>24 Active Members</span>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <Button className="bg-yellow-600 hover:bg-yellow-700">
                Join Featured Circle
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AIAssistant 
        contextType="community" 
        contextData={circlesContextData}
        className="bottom-4 left-4"
      />
    </div>
  );
}
