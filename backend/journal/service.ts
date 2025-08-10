import { journalDB } from "./db";
import { ModuleError, handleModuleError } from "../shared/errors";
import { getModuleConfig } from "../shared/config";
import type { 
  JournalEntry, 
  JournalAnalytics,
  CreateJournalEntryRequest,
  UpdateJournalEntryRequest,
  ListJournalEntriesRequest,
  ListJournalEntriesResponse
} from "./types";

export class JournalService {
  private readonly MODULE_NAME = 'journal';

  async createEntry(userId: string, request: CreateJournalEntryRequest): Promise<JournalEntry> {
    try {
      const entry = await journalDB.queryRow<JournalEntry>`
        INSERT INTO journal_entries (
          user_id, title, content, tags, mood, weather, location
        )
        VALUES (
          ${userId}, ${request.title}, ${request.content}, 
          ${request.tags || []}, ${request.mood}, ${request.weather}, ${request.location}
        )
        RETURNING id, user_id, title, content, tags, mood, weather, location, created_at, updated_at
      `;

      if (!entry) {
        throw new ModuleError(this.MODULE_NAME, 'createEntry', 'Failed to create journal entry');
      }

      return entry;
    } catch (error) {
      handleModuleError(this.MODULE_NAME, 'createEntry', error);
    }
  }

  async updateEntry(userId: string, request: UpdateJournalEntryRequest): Promise<JournalEntry> {
    try {
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (request.title !== undefined) {
        updateFields.push(`title = $${updateValues.length + 1}`);
        updateValues.push(request.title);
      }

      if (request.content !== undefined) {
        updateFields.push(`content = $${updateValues.length + 1}`);
        updateValues.push(request.content);
      }

      if (request.tags !== undefined) {
        updateFields.push(`tags = $${updateValues.length + 1}`);
        updateValues.push(request.tags);
      }

      if (request.mood !== undefined) {
        updateFields.push(`mood = $${updateValues.length + 1}`);
        updateValues.push(request.mood);
      }

      if (request.weather !== undefined) {
        updateFields.push(`weather = $${updateValues.length + 1}`);
        updateValues.push(request.weather);
      }

      if (request.location !== undefined) {
        updateFields.push(`location = $${updateValues.length + 1}`);
        updateValues.push(request.location);
      }

      if (updateFields.length === 0) {
        throw new ModuleError(this.MODULE_NAME, 'updateEntry', 'No fields to update');
      }

      updateFields.push(`updated_at = NOW()`);
      updateValues.push(request.id, userId);

      const query = `
        UPDATE journal_entries
        SET ${updateFields.join(', ')}
        WHERE id = $${updateValues.length - 1} AND user_id = $${updateValues.length}
        RETURNING id, user_id, title, content, tags, mood, weather, location, created_at, updated_at
      `;

      const entry = await journalDB.rawQueryRow<JournalEntry>(query, ...updateValues);

      if (!entry) {
        throw new ModuleError(this.MODULE_NAME, 'updateEntry', 'Journal entry not found');
      }

      return entry;
    } catch (error) {
      handleModuleError(this.MODULE_NAME, 'updateEntry', error);
    }
  }

  async deleteEntry(userId: string, entryId: string): Promise<void> {
    try {
      await journalDB.exec`
        DELETE FROM journal_entries
        WHERE id = ${entryId} AND user_id = ${userId}
      `;
    } catch (error) {
      handleModuleError(this.MODULE_NAME, 'deleteEntry', error);
    }
  }

  async getEntry(userId: string, entryId: string): Promise<JournalEntry | null> {
    try {
      const entry = await journalDB.queryRow<JournalEntry>`
        SELECT id, user_id, title, content, tags, mood, weather, location, created_at, updated_at
        FROM journal_entries
        WHERE id = ${entryId} AND user_id = ${userId}
      `;

      return entry;
    } catch (error) {
      handleModuleError(this.MODULE_NAME, 'getEntry', error);
    }
  }

  async listEntries(userId: string, request: ListJournalEntriesRequest = {}): Promise<ListJournalEntriesResponse> {
    try {
      const limit = request.limit || 50;
      const offset = request.offset || 0;

      let whereConditions = ['user_id = $1'];
      let queryParams: any[] = [userId];
      let paramIndex = 2;

      if (request.search) {
        whereConditions.push(`(title ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`);
        queryParams.push(`%${request.search}%`);
        paramIndex++;
      }

      if (request.tags && request.tags.length > 0) {
        whereConditions.push(`tags && $${paramIndex}`);
        queryParams.push(request.tags);
        paramIndex++;
      }

      if (request.date_from) {
        whereConditions.push(`created_at >= $${paramIndex}`);
        queryParams.push(request.date_from);
        paramIndex++;
      }

      if (request.date_to) {
        whereConditions.push(`created_at <= $${paramIndex}`);
        queryParams.push(request.date_to);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM journal_entries WHERE ${whereClause}`;
      const countResult = await journalDB.rawQueryRow<{ total: number }>(countQuery, ...queryParams);
      const total = countResult?.total || 0;

      // Get entries
      const entriesQuery = `
        SELECT id, user_id, title, content, tags, mood, weather, location, created_at, updated_at
        FROM journal_entries
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const entries = await journalDB.rawQueryAll<JournalEntry>(
        entriesQuery, 
        ...queryParams, 
        limit, 
        offset
      );

      return {
        entries: entries || [],
        total,
        has_more: offset + limit < total
      };
    } catch (error) {
      handleModuleError(this.MODULE_NAME, 'listEntries', error);
    }
  }

  async getAnalytics(userId: string): Promise<JournalAnalytics> {
    try {
      // Basic stats
      const basicStats = await journalDB.queryRow<{
        total_entries: number;
        entries_this_week: number;
        entries_this_month: number;
        average_mood: number;
      }>`
        SELECT 
          COUNT(*) as total_entries,
          COUNT(CASE WHEN created_at >= DATE_TRUNC('week', NOW()) THEN 1 END) as entries_this_week,
          COUNT(CASE WHEN created_at >= DATE_TRUNC('month', NOW()) THEN 1 END) as entries_this_month,
          COALESCE(AVG(mood), 0) as average_mood
        FROM journal_entries
        WHERE user_id = ${userId}
      `;

      // Most common tags
      const tagStats = await journalDB.queryAll<{ tag: string; count: number }>`
        SELECT tag, COUNT(*) as count
        FROM journal_entries, UNNEST(tags) as tag
        WHERE user_id = ${userId}
        GROUP BY tag
        ORDER BY count DESC
        LIMIT 10
      `;

      // Calculate writing streak
      const streakData = await journalDB.queryAll<{ entry_date: Date }>`
        SELECT DISTINCT DATE(created_at) as entry_date
        FROM journal_entries
        WHERE user_id = ${userId}
        ORDER BY entry_date DESC
      `;

      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      let lastDate: Date | null = null;

      for (const row of streakData) {
        const entryDate = new Date(row.entry_date);
        
        if (lastDate === null) {
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          
          if (entryDate.toDateString() === today.toDateString() || 
              entryDate.toDateString() === yesterday.toDateString()) {
            currentStreak = 1;
            tempStreak = 1;
          }
        } else {
          const daysDiff = Math.floor((lastDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
          
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
        
        lastDate = entryDate;
      }
      
      longestStreak = Math.max(longestStreak, tempStreak);

      return {
        total_entries: basicStats?.total_entries || 0,
        entries_this_week: basicStats?.entries_this_week || 0,
        entries_this_month: basicStats?.entries_this_month || 0,
        average_mood: Math.round((basicStats?.average_mood || 0) * 10) / 10,
        most_common_tags: tagStats || [],
        writing_streak: currentStreak,
        longest_streak: longestStreak
      };
    } catch (error) {
      handleModuleError(this.MODULE_NAME, 'getAnalytics', error);
    }
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: string }> {
    try {
      await journalDB.queryRow`SELECT 1`;
      return { status: 'healthy', details: 'Database connection successful' };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}
