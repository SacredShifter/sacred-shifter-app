import { SQLDatabase } from "encore.dev/storage/sqldb";
import { ModuleError, handleModuleError } from "../shared/errors";
import type {
  CodexEntry,
  CodexAnalytics,
  CreateCodexEntryRequest,
  UpdateCodexEntryRequest,
  ListCodexEntriesRequest,
  ListCodexEntriesResponse,
  ShareCodexEntryRequest,
  ReactToCodexEntryRequest,
  FindSimilarEntriesRequest,
  FindSimilarEntriesResponse,
  SimilarEntry
} from "./types";

export class CodexService {
  private db: SQLDatabase;
  private readonly MODULE_NAME = 'codex';

  constructor() {
    this.db = new SQLDatabase("sacred_codex", {
      migrations: "./migrations",
    });
  }

  async createEntry(userId: string, request: CreateCodexEntryRequest): Promise<CodexEntry> {
    try {
      const entry = await this.db.queryRow<CodexEntry>`
        INSERT INTO resonant_codex_entries (
          owner_id, mode, title, content, entry_type, tags, 
          resonance_rating, resonance_signature, resonance_channels, 
          occurred_at, context, visibility, parent_id
        )
        VALUES (
          ${userId}, ${request.mode}, ${request.title}, ${JSON.stringify(request.content)},
          ${request.entry_type}, ${request.tags || []}, ${request.resonance_rating},
          ${request.resonance_signature}, ${request.resonance_channels || []},
          ${request.occurred_at}, ${JSON.stringify(request.context || {})},
          ${request.visibility || 'private'}, ${request.parent_id}
        )
        RETURNING id, owner_id, mode, title, content, entry_type, tags,
                  resonance_rating, resonance_signature, resonance_channels,
                  occurred_at, context, ai_summary, ai_labels, visibility,
                  is_verified, parent_id, created_at, updated_at
      `;

      if (!entry) {
        throw new ModuleError(this.MODULE_NAME, 'createEntry', 'Failed to create codex entry');
      }

      // Generate AI insights asynchronously
      this.generateAIInsights(entry.id, request.content.body, request.tags || []);

      return entry;
    } catch (error) {
      handleModuleError(this.MODULE_NAME, 'createEntry', error);
    }
  }

  async updateEntry(userId: string, request: UpdateCodexEntryRequest): Promise<CodexEntry> {
    try {
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (request.title !== undefined) {
        updateFields.push(`title = $${updateValues.length + 1}`);
        updateValues.push(request.title);
      }

      if (request.content !== undefined) {
        updateFields.push(`content = $${updateValues.length + 1}`);
        updateValues.push(JSON.stringify(request.content));
      }

      if (request.entry_type !== undefined) {
        updateFields.push(`entry_type = $${updateValues.length + 1}`);
        updateValues.push(request.entry_type);
      }

      if (request.tags !== undefined) {
        updateFields.push(`tags = $${updateValues.length + 1}`);
        updateValues.push(request.tags);
      }

      if (request.resonance_rating !== undefined) {
        updateFields.push(`resonance_rating = $${updateValues.length + 1}`);
        updateValues.push(request.resonance_rating);
      }

      if (request.resonance_signature !== undefined) {
        updateFields.push(`resonance_signature = $${updateValues.length + 1}`);
        updateValues.push(request.resonance_signature);
      }

      if (request.resonance_channels !== undefined) {
        updateFields.push(`resonance_channels = $${updateValues.length + 1}`);
        updateValues.push(request.resonance_channels);
      }

      if (request.occurred_at !== undefined) {
        updateFields.push(`occurred_at = $${updateValues.length + 1}`);
        updateValues.push(request.occurred_at);
      }

      if (request.context !== undefined) {
        updateFields.push(`context = $${updateValues.length + 1}`);
        updateValues.push(JSON.stringify(request.context));
      }

      if (request.visibility !== undefined) {
        updateFields.push(`visibility = $${updateValues.length + 1}`);
        updateValues.push(request.visibility);
      }

      if (updateFields.length === 0) {
        throw new ModuleError(this.MODULE_NAME, 'updateEntry', 'No fields to update');
      }

      updateFields.push(`updated_at = NOW()`);
      updateValues.push(request.id, userId);

      const query = `
        UPDATE resonant_codex_entries
        SET ${updateFields.join(', ')}
        WHERE id = $${updateValues.length - 1} AND owner_id = $${updateValues.length}
        RETURNING id, owner_id, mode, title, content, entry_type, tags,
                  resonance_rating, resonance_signature, resonance_channels,
                  occurred_at, context, ai_summary, ai_labels, visibility,
                  is_verified, parent_id, created_at, updated_at
      `;

      const entry = await this.db.rawQueryRow<CodexEntry>(query, ...updateValues);

      if (!entry) {
        throw new ModuleError(this.MODULE_NAME, 'updateEntry', 'Codex entry not found');
      }

      // Regenerate AI insights if content changed
      if (request.content !== undefined) {
        this.generateAIInsights(entry.id, request.content.body, entry.tags);
      }

      return entry;
    } catch (error) {
      handleModuleError(this.MODULE_NAME, 'updateEntry', error);
    }
  }

  async deleteEntry(userId: string, entryId: string): Promise<void> {
    try {
      await this.db.exec`
        DELETE FROM resonant_codex_entries
        WHERE id = ${entryId} AND owner_id = ${userId}
      `;
    } catch (error) {
      handleModuleError(this.MODULE_NAME, 'deleteEntry', error);
    }
  }

  async getEntry(userId: string, entryId: string): Promise<CodexEntry | null> {
    try {
      const entry = await this.db.queryRow<CodexEntry>`
        SELECT id, owner_id, mode, title, content, entry_type, tags,
               resonance_rating, resonance_signature, resonance_channels,
               occurred_at, context, ai_summary, ai_labels, visibility,
               is_verified, parent_id, created_at, updated_at
        FROM resonant_codex_entries
        WHERE id = ${entryId} 
          AND (owner_id = ${userId} 
               OR visibility = 'public' 
               OR EXISTS (
                 SELECT 1 FROM resonant_codex_shares 
                 WHERE entry_id = ${entryId} AND user_id = ${userId}
               ))
      `;

      return entry;
    } catch (error) {
      handleModuleError(this.MODULE_NAME, 'getEntry', error);
    }
  }

  async listEntries(userId: string, request: ListCodexEntriesRequest = {}): Promise<ListCodexEntriesResponse> {
    try {
      const limit = request.limit || 50;
      const offset = request.offset || 0;

      let whereConditions = [
        `(owner_id = $1 OR visibility = 'public' OR EXISTS (
          SELECT 1 FROM resonant_codex_shares 
          WHERE entry_id = resonant_codex_entries.id AND user_id = $1
        ))`
      ];
      let queryParams: any[] = [userId];
      let paramIndex = 2;

      if (request.mode) {
        whereConditions.push(`mode = $${paramIndex}`);
        queryParams.push(request.mode);
        paramIndex++;
      }

      if (request.entry_type) {
        whereConditions.push(`entry_type = $${paramIndex}`);
        queryParams.push(request.entry_type);
        paramIndex++;
      }

      if (request.tags && request.tags.length > 0) {
        whereConditions.push(`tags && $${paramIndex}`);
        queryParams.push(request.tags);
        paramIndex++;
      }

      if (request.search) {
        whereConditions.push(`(
          title ILIKE $${paramIndex} OR 
          content->>'body' ILIKE $${paramIndex} OR
          array_to_string(tags, ' ') ILIKE $${paramIndex}
        )`);
        queryParams.push(`%${request.search}%`);
        paramIndex++;
      }

      if (request.visibility) {
        whereConditions.push(`visibility = $${paramIndex}`);
        queryParams.push(request.visibility);
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

      if (request.resonance_min !== undefined) {
        whereConditions.push(`resonance_rating >= $${paramIndex}`);
        queryParams.push(request.resonance_min);
        paramIndex++;
      }

      if (request.resonance_max !== undefined) {
        whereConditions.push(`resonance_rating <= $${paramIndex}`);
        queryParams.push(request.resonance_max);
        paramIndex++;
      }

      if (request.verified_only) {
        whereConditions.push(`is_verified = true`);
      }

      const whereClause = whereConditions.join(' AND ');

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM resonant_codex_entries WHERE ${whereClause}`;
      const countResult = await this.db.rawQueryRow<{ total: number }>(countQuery, ...queryParams);
      const total = countResult?.total || 0;

      // Get entries
      const entriesQuery = `
        SELECT id, owner_id, mode, title, content, entry_type, tags,
               resonance_rating, resonance_signature, resonance_channels,
               occurred_at, context, ai_summary, ai_labels, visibility,
               is_verified, parent_id, created_at, updated_at
        FROM resonant_codex_entries
        WHERE ${whereClause}
        ORDER BY 
          CASE WHEN mode = 'register' AND occurred_at IS NOT NULL 
               THEN occurred_at 
               ELSE created_at 
          END DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const entries = await this.db.rawQueryAll<CodexEntry>(
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

  async shareEntry(userId: string, request: ShareCodexEntryRequest): Promise<void> {
    try {
      // Verify user owns the entry
      const entry = await this.db.queryRow`
        SELECT id FROM resonant_codex_entries
        WHERE id = ${request.entry_id} AND owner_id = ${userId}
      `;

      if (!entry) {
        throw new ModuleError(this.MODULE_NAME, 'shareEntry', 'Entry not found or access denied');
      }

      await this.db.exec`
        INSERT INTO resonant_codex_shares (entry_id, user_id, can_edit)
        VALUES (${request.entry_id}, ${request.user_id}, ${request.can_edit || false})
        ON CONFLICT (entry_id, user_id) 
        DO UPDATE SET can_edit = ${request.can_edit || false}
      `;
    } catch (error) {
      handleModuleError(this.MODULE_NAME, 'shareEntry', error);
    }
  }

  async unshareEntry(userId: string, entryId: string, targetUserId: string): Promise<void> {
    try {
      await this.db.exec`
        DELETE FROM resonant_codex_shares
        WHERE entry_id = ${entryId} 
          AND user_id = ${targetUserId}
          AND EXISTS (
            SELECT 1 FROM resonant_codex_entries
            WHERE id = ${entryId} AND owner_id = ${userId}
          )
      `;
    } catch (error) {
      handleModuleError(this.MODULE_NAME, 'unshareEntry', error);
    }
  }

  async reactToEntry(userId: string, request: ReactToCodexEntryRequest): Promise<void> {
    try {
      await this.db.exec`
        INSERT INTO resonant_codex_reactions (entry_id, user_id, kind)
        VALUES (${request.entry_id}, ${userId}, ${request.kind})
        ON CONFLICT (entry_id, user_id) DO NOTHING
      `;
    } catch (error) {
      handleModuleError(this.MODULE_NAME, 'reactToEntry', error);
    }
  }

  async findSimilarEntries(userId: string, request: FindSimilarEntriesRequest): Promise<FindSimilarEntriesResponse> {
    try {
      // Get the source entry
      const sourceEntry = await this.getEntry(userId, request.entry_id);
      if (!sourceEntry) {
        throw new ModuleError(this.MODULE_NAME, 'findSimilarEntries', 'Source entry not found');
      }

      // For now, use tag-based similarity (in a real implementation, you'd use vector similarity)
      const limit = request.limit || 10;
      
      let modeFilter = '';
      let modeParams: any[] = [];
      if (request.mode) {
        modeFilter = 'AND mode = $3';
        modeParams = [request.mode];
      }

      const similarEntries = await this.db.rawQueryAll<CodexEntry & { matching_tag_count: number }>(
        `SELECT id, owner_id, mode, title, content, entry_type, tags,
                resonance_rating, resonance_signature, resonance_channels,
                occurred_at, context, ai_summary, ai_labels, visibility,
                is_verified, parent_id, created_at, updated_at,
                (
                  SELECT COUNT(*)
                  FROM unnest(tags) AS tag
                  WHERE tag = ANY($2)
                ) as matching_tag_count
         FROM resonant_codex_entries
         WHERE id != $1 
           AND (owner_id = $1 OR visibility = 'public')
           AND tags && $2
           ${modeFilter}
         ORDER BY matching_tag_count DESC, created_at DESC
         LIMIT ${limit}`,
        request.entry_id, 
        sourceEntry.tags, 
        ...modeParams
      );

      const similar: SimilarEntry[] = similarEntries.map(entry => {
        const matchingTags = sourceEntry.tags.filter(tag => entry.tags.includes(tag));
        const matchingLabels = sourceEntry.ai_labels.filter(label => entry.ai_labels.includes(label));
        const similarity = (matchingTags.length + matchingLabels.length) / 
                          Math.max(sourceEntry.tags.length + sourceEntry.ai_labels.length, 1);

        return {
          entry: {
            id: entry.id,
            owner_id: entry.owner_id,
            mode: entry.mode,
            title: entry.title,
            content: entry.content,
            entry_type: entry.entry_type,
            tags: entry.tags,
            resonance_rating: entry.resonance_rating,
            resonance_signature: entry.resonance_signature,
            resonance_channels: entry.resonance_channels,
            occurred_at: entry.occurred_at,
            context: entry.context,
            ai_summary: entry.ai_summary,
            ai_labels: entry.ai_labels,
            visibility: entry.visibility,
            is_verified: entry.is_verified,
            parent_id: entry.parent_id,
            created_at: entry.created_at,
            updated_at: entry.updated_at
          },
          similarity_score: similarity,
          matching_tags: matchingTags,
          matching_labels: matchingLabels
        };
      });

      return { similar_entries: similar };
    } catch (error) {
      handleModuleError(this.MODULE_NAME, 'findSimilarEntries', error);
    }
  }

  async getAnalytics(userId: string): Promise<CodexAnalytics> {
    try {
      // Basic stats
      const basicStats = await this.db.queryRow<{
        total_entries: number;
        codex_entries: number;
        register_entries: number;
        entries_this_week: number;
        entries_this_month: number;
        average_resonance: number;
        verified_entries: number;
        shared_entries: number;
      }>`
        SELECT 
          COUNT(*) as total_entries,
          COUNT(CASE WHEN mode = 'codex' THEN 1 END) as codex_entries,
          COUNT(CASE WHEN mode = 'register' THEN 1 END) as register_entries,
          COUNT(CASE WHEN created_at >= DATE_TRUNC('week', NOW()) THEN 1 END) as entries_this_week,
          COUNT(CASE WHEN created_at >= DATE_TRUNC('month', NOW()) THEN 1 END) as entries_this_month,
          COALESCE(AVG(resonance_rating), 0) as average_resonance,
          COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_entries,
          COUNT(CASE WHEN visibility != 'private' THEN 1 END) as shared_entries
        FROM resonant_codex_entries
        WHERE owner_id = ${userId}
      `;

      // Most common tags
      const tagStats = await this.db.queryAll<{ tag: string; count: number }>`
        SELECT tag, COUNT(*) as count
        FROM resonant_codex_entries, UNNEST(tags) as tag
        WHERE owner_id = ${userId}
        GROUP BY tag
        ORDER BY count DESC
        LIMIT 10
      `;

      // Entry types
      const typeStats = await this.db.queryAll<{ type: string; count: number }>`
        SELECT entry_type as type, COUNT(*) as count
        FROM resonant_codex_entries
        WHERE owner_id = ${userId} AND entry_type IS NOT NULL
        GROUP BY entry_type
        ORDER BY count DESC
      `;

      // Resonance distribution
      const resonanceStats = await this.db.queryAll<{ range: string; count: number }>`
        SELECT 
          CASE 
            WHEN resonance_rating >= 0.8 THEN 'High (0.8-1.0)'
            WHEN resonance_rating >= 0.6 THEN 'Medium (0.6-0.8)'
            WHEN resonance_rating >= 0.4 THEN 'Low (0.4-0.6)'
            WHEN resonance_rating IS NOT NULL THEN 'Very Low (0.0-0.4)'
            ELSE 'Unrated'
          END as range,
          COUNT(*) as count
        FROM resonant_codex_entries
        WHERE owner_id = ${userId}
        GROUP BY range
        ORDER BY 
          CASE range
            WHEN 'High (0.8-1.0)' THEN 1
            WHEN 'Medium (0.6-0.8)' THEN 2
            WHEN 'Low (0.4-0.6)' THEN 3
            WHEN 'Very Low (0.0-0.4)' THEN 4
            ELSE 5
          END
      `;

      return {
        total_entries: basicStats?.total_entries || 0,
        codex_entries: basicStats?.codex_entries || 0,
        register_entries: basicStats?.register_entries || 0,
        entries_this_week: basicStats?.entries_this_week || 0,
        entries_this_month: basicStats?.entries_this_month || 0,
        average_resonance: Math.round((basicStats?.average_resonance || 0) * 100) / 100,
        verified_entries: basicStats?.verified_entries || 0,
        shared_entries: basicStats?.shared_entries || 0,
        most_common_tags: tagStats || [],
        entry_types: typeStats || [],
        resonance_distribution: resonanceStats || []
      };
    } catch (error) {
      handleModuleError(this.MODULE_NAME, 'getAnalytics', error);
    }
  }

  private async generateAIInsights(entryId: string, body: string, tags: string[]): Promise<void> {
    try {
      // Simple AI insights generation (in a real implementation, you'd call an AI service)
      const summary = this.generateSummary(body);
      const labels = this.generateLabels(body, tags);

      await this.db.exec`
        UPDATE resonant_codex_entries
        SET ai_summary = ${summary}, ai_labels = ${labels}
        WHERE id = ${entryId}
      `;
    } catch (error) {
      console.error('Failed to generate AI insights:', error);
      // Don't throw - this is a background operation
    }
  }

  private generateSummary(body: string): string {
    // Simple summary generation - take first sentence or truncate
    const sentences = body.split(/[.!?]+/);
    const firstSentence = sentences[0]?.trim();
    
    if (firstSentence && firstSentence.length > 20) {
      return firstSentence + '.';
    }
    
    return body.length > 100 ? body.substring(0, 97) + '...' : body;
  }

  private generateLabels(body: string, existingTags: string[]): string[] {
    const labels = [...existingTags];
    const lowerBody = body.toLowerCase();

    // Simple keyword detection
    const keywords = {
      'meditation': ['meditat', 'mindful', 'breath', 'awareness'],
      'synchronicity': ['synchron', 'coinciden', 'sign', 'meaning'],
      'vision': ['vision', 'visual', 'see', 'light'],
      'energy': ['energy', 'vibrat', 'frequen', 'resonan'],
      'consciousness': ['conscious', 'aware', 'expand', 'transcend'],
      'spiritual': ['spirit', 'sacred', 'divine', 'holy'],
      'transformation': ['transform', 'change', 'shift', 'evolv'],
      'unity': ['unity', 'oneness', 'connect', 'universal']
    };

    for (const [label, words] of Object.entries(keywords)) {
      if (words.some(word => lowerBody.includes(word)) && !labels.includes(label)) {
        labels.push(label);
      }
    }

    return labels;
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
