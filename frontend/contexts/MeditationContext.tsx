import { createContext, useContext, useState, ReactNode } from 'react';

interface MeditationContextType {
  isPlaying: boolean;
  currentSoundscape: string;
  volume: number;
  setIsPlaying: (playing: boolean) => void;
  setCurrentSoundscape: (soundscape: string) => void;
  setVolume: (volume: number) => void;
}

const MeditationContext = createContext<MeditationContextType | undefined>(undefined);

export function useMeditation() {
  const context = useContext(MeditationContext);
  if (context === undefined) {
    throw new Error('useMeditation must be used within a MeditationProvider');
  }
  return context;
}

interface MeditationProviderProps {
  children: ReactNode;
}

export function MeditationProvider({ children }: MeditationProviderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSoundscape, setCurrentSoundscape] = useState('forest');
  const [volume, setVolume] = useState(0.5);

  return (
    <MeditationContext.Provider value={{
      isPlaying,
      currentSoundscape,
      volume,
      setIsPlaying,
      setCurrentSoundscape,
      setVolume,
    }}>
      {children}
    </MeditationContext.Provider>
  );
}
