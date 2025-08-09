import { api } from "encore.dev/api";
import { meditationDB } from "./db";

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
  soundscape_breakdown: Array<{
    soundscape: string;
    count: number;
    total_duration: number;
  }>;
  weekly_progress: Array<{
    week_start: Date;
    session_count: number;
    total_duration: number;
  }>;
}

// Retrieves meditation analytics for the current user.
export const getAnalytics = api<void, MeditationAnalytics>(
  { expose: true, method: "GET", path: "/meditation/analytics" },
  async () => {
    const userId = "default-user"; // Use default user since no auth

    // Get basic stats
    const basicStats = await meditationDB.queryRow<{
      total_sessions: number;
      completed_sessions: number;
      total_meditation_time: number;
      average_session_duration: number;
    }>`
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN completed = TRUE THEN 1 END) as completed_sessions,
        COALESCE(SUM(CASE WHEN completed = TRUE THEN duration_seconds ELSE 0 END), 0) as total_meditation_time,
        COALESCE(AVG(CASE WHEN completed = TRUE THEN duration_seconds END), 0) as average_session_duration
      FROM meditation_sessions
      WHERE user_id = ${userId}
    `;

    // Get favorite soundscape
    const favoriteSoundscape = await meditationDB.queryRow<{
      soundscape: string;
    }>`
      SELECT soundscape
      FROM meditation_sessions
      WHERE user_id = ${userId} AND completed = TRUE
      GROUP BY soundscape
      ORDER BY COUNT(*) DESC
      LIMIT 1
    `;

    // Get sessions this week and month
    const recentStats = await meditationDB.queryRow<{
      sessions_this_week: number;
      sessions_this_month: number;
    }>`
      SELECT 
        COUNT(CASE WHEN started_at >= DATE_TRUNC('week', NOW()) THEN 1 END) as sessions_this_week,
        COUNT(CASE WHEN started_at >= DATE_TRUNC('month', NOW()) THEN 1 END) as sessions_this_month
      FROM meditation_sessions
      WHERE user_id = ${userId} AND completed = TRUE
    `;

    // Get soundscape breakdown
    const soundscapeBreakdown = await meditationDB.queryAll<{
      soundscape: string;
      count: number;
      total_duration: number;
    }>`
      SELECT 
        soundscape,
        COUNT(*) as count,
        COALESCE(SUM(duration_seconds), 0) as total_duration
      FROM meditation_sessions
      WHERE user_id = ${userId} AND completed = TRUE
      GROUP BY soundscape
      ORDER BY count DESC
    `;

    // Get weekly progress for the last 8 weeks
    const weeklyProgress = await meditationDB.queryAll<{
      week_start: Date;
      session_count: number;
      total_duration: number;
    }>`
      SELECT 
        DATE_TRUNC('week', started_at) as week_start,
        COUNT(*) as session_count,
        COALESCE(SUM(duration_seconds), 0) as total_duration
      FROM meditation_sessions
      WHERE user_id = ${userId} 
        AND completed = TRUE
        AND started_at >= NOW() - INTERVAL '8 weeks'
      GROUP BY DATE_TRUNC('week', started_at)
      ORDER BY week_start DESC
    `;

    // Calculate streaks (simplified - consecutive days with at least one session)
    const streakData = await meditationDB.queryAll<{
      session_date: Date;
    }>`
      SELECT DISTINCT DATE(started_at) as session_date
      FROM meditation_sessions
      WHERE user_id = ${userId} AND completed = TRUE
      ORDER BY session_date DESC
    `;

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    for (const row of streakData) {
      const sessionDate = new Date(row.session_date);
      
      if (lastDate === null) {
        // First session
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (sessionDate.toDateString() === today.toDateString() || 
            sessionDate.toDateString() === yesterday.toDateString()) {
          currentStreak = 1;
          tempStreak = 1;
        }
      } else {
        const daysDiff = Math.floor((lastDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          // Consecutive day
          tempStreak++;
          if (currentStreak > 0) {
            currentStreak++;
          }
        } else {
          // Streak broken
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
          currentStreak = 0;
        }
      }
      
      lastDate = sessionDate;
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      total_sessions: basicStats?.total_sessions || 0,
      completed_sessions: basicStats?.completed_sessions || 0,
      total_meditation_time: basicStats?.total_meditation_time || 0,
      average_session_duration: Math.round(basicStats?.average_session_duration || 0),
      favorite_soundscape: favoriteSoundscape?.soundscape || null,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      sessions_this_week: recentStats?.sessions_this_week || 0,
      sessions_this_month: recentStats?.sessions_this_month || 0,
      soundscape_breakdown: soundscapeBreakdown || [],
      weekly_progress: weeklyProgress || [],
    };
  }
);
