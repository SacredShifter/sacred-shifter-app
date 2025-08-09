import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import backend from '~backend/client';
import type { MeditationSession } from '~backend/meditation/sessions';

interface MeditationContextType {
  isPlaying: boolean;
  currentSoundscape: string;
  volume: number;
  currentSession: MeditationSession | null;
  sessionDuration: number;
  setIsPlaying: (playing: boolean) => void;
  setCurrentSoundscape: (soundscape: string) => void;
  setVolume: (volume: number) => void;
  startMeditationSession: (soundscape: string) => Promise<void>;
  endMeditationSession: () => Promise<void>;
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
  const [sessionDuration, setSessionDuration] = useState(0);
  const queryClient = useQueryClient();

  // Get current active session
  const { data: currentSessionData } = useQuery({
    queryKey: ['current-meditation-session'],
    queryFn: () => backend.meditation.getCurrentSession(),
    refetchInterval: 5000, // Check every 5 seconds
  });

  const currentSession = currentSessionData?.session || null;

  // Start session mutation
  const startSessionMutation = useMutation({
    mutationFn: (soundscape: string) => backend.meditation.startSession({ soundscape }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-meditation-session'] });
      queryClient.invalidateQueries({ queryKey: ['meditation-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['meditation-analytics'] });
    },
  });

  // End session mutation
  const endSessionMutation = useMutation({
    mutationFn: (id: string) => backend.meditation.endSession({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-meditation-session'] });
      queryClient.invalidateQueries({ queryKey: ['meditation-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['meditation-analytics'] });
      setIsPlaying(false);
      setSessionDuration(0);
    },
  });

  // Update session duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (currentSession && !currentSession.completed) {
      interval = setInterval(() => {
        const startTime = new Date(currentSession.started_at).getTime();
        const now = Date.now();
        const duration = Math.floor((now - startTime) / 1000);
        setSessionDuration(duration);
      }, 1000);
    } else {
      setSessionDuration(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [currentSession]);

  const startMeditationSession = async (soundscape: string) => {
    await startSessionMutation.mutateAsync(soundscape);
    setCurrentSoundscape(soundscape);
    setIsPlaying(true);
  };

  const endMeditationSession = async () => {
    if (currentSession) {
      await endSessionMutation.mutateAsync(currentSession.id);
    }
  };

  return (
    <MeditationContext.Provider value={{
      isPlaying,
      currentSoundscape,
      volume,
      currentSession,
      sessionDuration,
      setIsPlaying,
      setCurrentSoundscape,
      setVolume,
      startMeditationSession,
      endMeditationSession,
    }}>
      {children}
    </MeditationContext.Provider>
  );
}
