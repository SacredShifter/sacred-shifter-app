import { useState } from 'react';
import { Play, Pause, Volume2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMeditation } from '../contexts/MeditationContext';

const soundscapes = [
  { id: 'forest', name: 'Forest Sounds', description: 'Gentle rustling leaves and bird songs' },
  { id: 'ocean', name: 'Ocean Waves', description: 'Rhythmic waves on a peaceful shore' },
  { id: 'rain', name: 'Gentle Rain', description: 'Soft rainfall on leaves' },
  { id: 'tibetan', name: 'Tibetan Bowls', description: 'Resonant singing bowls' },
  { id: 'cosmic', name: 'Cosmic Frequencies', description: 'Ethereal space sounds' },
];

export default function MeditationPlayer() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isPlaying, currentSoundscape, volume, setIsPlaying, setCurrentSoundscape, setVolume } = useMeditation();

  const currentSoundscapeData = soundscapes.find(s => s.id === currentSoundscape);

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

            <div className="space-y-3">
              <Select value={currentSoundscape} onValueChange={setCurrentSoundscape}>
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

              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>

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
            className="w-full h-full rounded-lg"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </Button>
        )}
      </div>
    </div>
  );
}
