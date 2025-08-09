import { useState } from 'react';
import { Play, Pause, Volume2, ChevronUp, ChevronDown, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useMeditation } from '../contexts/MeditationContext';

const soundscapes = [
  { id: 'forest', name: 'Forest Sounds', description: 'Gentle rustling leaves and bird songs' },
  { id: 'ocean', name: 'Ocean Waves', description: 'Rhythmic waves on a peaceful shore' },
  { id: 'rain', name: 'Gentle Rain', description: 'Soft rainfall on leaves' },
  { id: 'tibetan', name: 'Tibetan Bowls', description: 'Resonant singing bowls' },
  { id: 'cosmic', name: 'Cosmic Frequencies', description: 'Ethereal space sounds' },
];

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function MeditationPlayer() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { 
    isPlaying, 
    currentSoundscape, 
    volume, 
    currentSession,
    sessionDuration,
    setIsPlaying, 
    setCurrentSoundscape, 
    setVolume,
    startMeditationSession,
    endMeditationSession
  } = useMeditation();

  const currentSoundscapeData = soundscapes.find(s => s.id === currentSoundscape);
  const hasActiveSession = currentSession && !currentSession.completed;

  const handlePlayPause = async () => {
    if (hasActiveSession) {
      setIsPlaying(!isPlaying);
    } else {
      // Start new session
      await startMeditationSession(currentSoundscape);
    }
  };

  const handleStop = async () => {
    if (hasActiveSession) {
      await endMeditationSession();
    }
  };

  const handleSoundscapeChange = async (newSoundscape: string) => {
    setCurrentSoundscape(newSoundscape);
    if (hasActiveSession) {
      // End current session and start new one
      await endMeditationSession();
      await startMeditationSession(newSoundscape);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`bg-white/90 backdrop-blur-lg rounded-lg shadow-lg border border-purple-200 transition-all duration-300 ${
        isExpanded ? 'w-80 p-4' : 'w-16 h-16 p-0'
      }`}>
        {isExpanded ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Meditation Soundscape</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>

            {hasActiveSession && (
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Active Session
                  </Badge>
                  <span className="text-lg font-mono text-green-700">
                    {formatDuration(sessionDuration)}
                  </span>
                </div>
                <p className="text-sm text-green-600">
                  {currentSoundscapeData?.name}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Select value={currentSoundscape} onValueChange={handleSoundscapeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {soundscapes.map((soundscape) => (
                    <SelectItem key={soundscape.id} value={soundscape.id}>
                      <div>
                        <div className="font-medium">{soundscape.name}</div>
                        <div className="text-xs text-gray-500">{soundscape.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePlayPause}
                  className="flex-shrink-0"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>

                {hasActiveSession && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStop}
                    className="flex-shrink-0"
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                )}

                <div className="flex items-center space-x-2 flex-1">
                  <Volume2 className="w-4 h-4 text-gray-500" />
                  <Slider
                    value={[volume * 100]}
                    onValueChange={(value) => setVolume(value[0] / 100)}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                </div>
              </div>

              {currentSoundscapeData && (
                <p className="text-xs text-gray-600">{currentSoundscapeData.description}</p>
              )}
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(true)}
            className="w-full h-full rounded-lg relative"
          >
            {hasActiveSession && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            )}
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </Button>
        )}
      </div>
    </div>
  );
}
