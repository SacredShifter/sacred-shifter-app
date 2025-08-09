import { SQLDatabase } from "encore.dev/storage/sqldb";
import { ModuleError, handleModuleError } from "../shared/errors";
import { getModuleConfig } from "../shared/config";
import type { 
  MeditationSession,
  MeditationAnalytics,
  StartSessionRequest,
  EndSessionRequest,
  ListSessionsRequest,
  ListSessionsResponse,
  CurrentSessionResponse
} from "./types";

export class MeditationService {
  private db: SQLDatabase;
  private readonly MODULE_NAME = 'meditation';

  constructor() {
    this.db = new SQLDatabase("meditation", {
      migrations: "./migrations",
    });
  }

  async startSession(userId: string, request: StartSessionRequest): Promise<MeditationSession> {
    try {
      // End any existing active sessions first
      await this.db.exec`
        UPDATE meditation_sessions
        SET completed = TRUE, ended_at = NOW(),
            duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER
        WHERE user_id = ${userId} AND completed = FALSE
      `;

      const session = await this.db.queryRow<MeditationSession>`
        INSERT INTO meditation_sessions (
          user_id, soundscape, mood_before, notes
        )
        VALUES (
          ${userId}, ${request.soundscape}, ${request.mood_before}, ${request.notes}
        )
        RETURNING id, user_id, soundscape, duration_seconds, completed, 
                  started_at, ended_at, notes, mood_before, mood_after, created_at, updated_at
      `;

      if (!session) {
        throw new ModuleError(this.MODULE_NAME, 'startSession', 'Failed to start meditation session');
      }

      return session;
    } catch (error) {
      handleModuleError(this.MODULE_NAME, 'startSession', error);
    }
  }

  async endSession(userId: string, request: EndSessionRequest): Promise<MeditationSession> {
    try {
      const session = await this.db.queryRow<MeditationSession>`
        UPDATE meditation_sessions
        SET 
          ended_at = NOW(),
          completed = TRUE,
          duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER,
          mood_after = ${request.mood_after},
          notes = COALESCE(${request.notes}, notes)
        WHERE id = ${request.id} AND user_id = ${userId} AND completed = FALSE
        RETURNING id, user_id, soundscape, duration_seconds, completed, 
                  started_at, ended_at, notes, mood_before, mood_after, created_at, updated_at
      `;

      if (!session) {
        throw new ModuleError(this.MODULE_NAME, 'endSession', 'Active meditation session not found');
      }

      return session;
    } catch (error) {
      handleModuleError(this.MODULE_NAME, 'endSession', error);
    }
  }

  async getCurrentSession(userId: string): Promise<CurrentSessionResponse> {
    try {
      const session = await this.db.queryRow<MeditationSession>`
        SELECT id, user_id, soundscape, duration_seconds, completed, 
               started_at, ended_at, notes, mood_before, mood_after, created_at, updated_at
        FROM meditation_sessions
        WHERE user_id = ${userId} AND completed = FALSE
        ORDER BY started_at DESC
        LIMIT 1
      `;

      return { session };
    } catch (error) {
      handleModuleError(this.MODULE_NAME, 'getCurrentSession', error);
    }
  }

  async listSessions(userId: string, request: ListSessionsRequest = {}): Promise<ListSessionsResponse> {
    try {
      const limit = request.limit || 50;
      const offset = request.offset || 0;

      let whereConditions = ['user_id = $1'];
      let queryParams: any[] = [userId];
      let paramIndex = 2;

      if (request.soundscape) {
        whereConditions.push(`soundscape = $${paramIndex}`);
        queryParams.push(request.soundscape);
        paramIndex++;
      }

      if (request.completed !== undefined) {
        whereConditions.push(`completed = $${paramIndex}`);
        queryParams.push(request.completed);
        paramIndex++;
      }

      if (request.date_from) {
        whereConditions.push(`started_at >= $${paramIndex}`);
        queryParams.push(request.date_from);
        paramIndex++;
      }

      if (request.date_to) {
        whereConditions.push(`started_at <= $${paramIndex}`);
        queryParams.push(request.date_to);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM meditation_sessions WHERE ${whereClause}`;
      const countResult = await this.db.rawQueryRow<{ total: number }>(countQuery, ...queryParams);
      const total = countResult?.total || 0;

      // Get sessions
      const sessionsQuery = `
        SELECT id, user_id, soundscape, duration_seconds, completed, 
               started_at, ended_at, notes, mood_before, mood_after, created_at, updated_at
        FROM meditation_sessions
        WHERE ${whereClause}
        ORDER BY started_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const sessions = await this.db.rawQueryAll<MeditationSession>(
        sessionsQuery, 
        ...queryParams, 
        limit, 
        offset
      );

      return {
        sessions: sessions || [],
        total,
        has_more: offset + limit < total
      };
    } catch (error) {
      handleModuleError(this.MODULE_NAME, 'listSessions', error);
    }
  }

  async getAnalytics(userId: string): Promise<MeditationAnalytics> {
    try {
      // Basic stats
      const basicStats = await this.db.queryRow<{
        total_sessions: number;
        completed_sessions: number;
        total_meditation_time: number;
        average_session_duration: number;
        mood_improvement: number;
      }>`
        SELECT 
          COUNT(*) as total_sessions,
          COUNT(CASE WHEN completed = TRUE THEN 1 END) as completed_sessions,
          COALESCE(SUM(CASE WHEN completed = TRUE THEN duration_seconds ELSE 0 END), 0) as total_meditation_time,
          COALESCE(AVG(CASE WHEN completed = TRUE THEN duration_seconds END), 0) as average_session_duration,
          COALESCE(AVG(CASE WHEN mood_before IS NOT NULL AND mood_after IS NOT NULL 
                            THEN mood_after - mood_before END), 0) as mood_improvement
        FROM meditation_sessions
        WHERE user_id = ${userId}
      `;

      // Favorite soundscape
      const favoriteSoundscape = await this.db.queryRow<{ soundscape: string }>`
        SELECT soundscape
        FROM meditation_sessions
        WHERE user_id = ${userId} AND completed = TRUE
        GROUP BY soundscape
        ORDER BY COUNT(*) DESC
        LIMIT 1
      `;

      // Recent stats
      const recentStats = await this.db.queryRow<{
        sessions_this_week: number;
        sessions_this_month: number;
      }>`
        SELECT 
          COUNT(CASE WHEN started_at >= DATE_TRUNC('week', NOW()) THEN 1 END) as sessions_this_week,
          COUNT(CASE WHEN started_at >= DATE_TRUNC('month', NOW()) THEN 1 END) as sessions_this_month
        FROM meditation_sessions
        WHERE user_id = ${userId} AND completed = TRUE
      `;

      // Soundscape breakdown
      const soundscapeBreakdown = await this.db.queryAll<{
        soundscape: string;
        count: number;
        total_duration: number;
        average_duration: number;
      }>`
        SELECT 
          soundscape,
          COUNT(*) as count,
          COALESCE(SUM(duration_seconds), 0) as total_duration,
          COALESCE(AVG(duration_seconds), 0) as average_duration
        FROM meditation_sessions
        WHERE user_id = ${userId} AND completed = TRUE
        GROUP BY soundscape
        ORDER BY count DESC
      `;

      // Weekly progress
      const weeklyProgress = await this.db.queryAll<{
        week_start: Date;
        session_count: number;
        total_duration: number;
        average_mood_improvement: number;
      }>`
        SELECT 
          DATE_TRUNC('week', started_at) as week_start,
          COUNT(*) as session_count,
          COALESCE(SUM(duration_seconds), 0) as total_duration,
          COALESCE(AVG(CASE WHEN mood_before IS NOT NULL AND mood_after IS NOT NULL 
                            THEN mood_after - mood_before END), 0) as average_mood_improvement
        FROM meditation_sessions
        WHERE user_id = ${userId} 
          AND completed = TRUE
          AND started_at >= NOW() - INTERVAL '8 weeks'
        GROUP BY DATE_TRUNC('week', started_at)
        ORDER BY week_start DESC
      `;

      // Calculate streaks
      const streakData = await this.db.queryAll<{ session_date: Date }>`
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
            tempStreak++;
            if (currentStreak > 0) {
              currentStreak++;
            }
          } else {
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
        mood_improvement: Math.round((basicStats?.mood_improvement || 0) * 10) / 10,
        soundscape_breakdown: soundscapeBreakdown || [],
        weekly_progress: weeklyProgress || [],
      };
    } catch (error) {
      handleModuleError(this.MODULE_NAME, 'getAnalytics', error);
    }
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: string }> {
    try {
      await this.db.queryRow`SELECT 1`;
      return { status: 'healthy', details: 'Database connection successful' };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}
