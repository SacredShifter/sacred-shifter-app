import { BaseEntity } from "../shared/types";

export interface MeditationSession extends BaseEntity {
  user_id: string;
  soundscape: string;
  duration_seconds: number | null;
  completed: boolean;
  started_at: Date;
  ended_at: Date | null;
  notes?: string;
  mood_before?: number;
  mood_after?: number;
}

export interface MeditationAnalytics {
  total_sessions: number;
  completed_sessions: number;
  total_meditation_time: number;
  average_session_duration: number;
  favorite_soundscape: string | null;
  current_streak: number;
  longest_streak: number;
  sessions_this_week: number;
  sessions_this_month: number;
  mood_improvement: number;
  soundscape_breakdown: Array<{
    soundscape: string;
    count: number;
    total_duration: number;
    average_duration: number;
  }>;
  weekly_progress: Array<{
    week_start: Date;
    session_count: number;
    total_duration: number;
    average_mood_improvement: number;
  }>;
}

export interface StartSessionRequest {
  soundscape: string;
  mood_before?: number;
  notes?: string;
}

export interface EndSessionRequest {
  id: string;
  mood_after?: number;
  notes?: string;
}

export interface ListSessionsRequest {
  limit?: number;
  offset?: number;
  soundscape?: string;
  completed?: boolean;
  date_from?: Date;
  date_to?: Date;
}

export interface ListSessionsResponse {
  sessions: MeditationSession[];
  total: number;
  has_more: boolean;
}

export interface CurrentSessionResponse {
  session: MeditationSession | null;
}
