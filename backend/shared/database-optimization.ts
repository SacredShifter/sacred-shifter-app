// Database optimization utilities for production
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { ProductionConfig } from "./production-config";
import { logError, measurePerformance } from "./middleware";

// Database connection pool management
export class DatabaseManager {
  private static instance: DatabaseManager;
  private connectionPools: Map<string, any> = new Map();

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  // Optimized query execution with retry logic
  async executeQuery<T>(
    db: SQLDatabase,
    operation: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    return measurePerformance(`db_${operation}`, async () => {
      let lastError: Error | null = null;
      const maxRetries = ProductionConfig.database.retryAttempts;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await queryFn();
        } catch (error) {
          lastError = error as Error;
          
          // Don't retry on certain errors
          if (this.isNonRetryableError(error)) {
            throw error;
          }

          if (attempt === maxRetries) {
            logError(lastError, { 
              operation, 
              attempt, 
              maxRetries,
              query: "database_operation" 
            });
            throw lastError;
          }

          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      throw lastError;
    });
  }

  private isNonRetryableError(error: any): boolean {
    // Don't retry on validation errors, constraint violations, etc.
    const nonRetryablePatterns = [
      "unique constraint",
      "foreign key constraint",
      "check constraint",
      "not null constraint",
      "invalid input syntax",
      "permission denied",
    ];

    const errorMessage = error?.message?.toLowerCase() || "";
    return nonRetryablePatterns.some(pattern => errorMessage.includes(pattern));
  }

  // Query optimization helpers
  buildPaginationQuery(
    baseQuery: string,
    limit: number = 50,
    offset: number = 0
  ): string {
    const safeLimit = Math.min(Math.max(1, limit), 1000); // Cap at 1000
    const safeOffset = Math.max(0, offset);
    
    return `${baseQuery} LIMIT ${safeLimit} OFFSET ${safeOffset}`;
  }

  // Index management utilities
  async createIndexIfNotExists(
    db: SQLDatabase,
    indexName: string,
    tableName: string,
    columns: string[],
    options: { unique?: boolean; concurrent?: boolean } = {}
  ): Promise<void> {
    const uniqueClause = options.unique ? "UNIQUE" : "";
    const concurrentClause = options.concurrent ? "CONCURRENTLY" : "";
    
    const query = `
      CREATE ${uniqueClause} INDEX ${concurrentClause} IF NOT EXISTS ${indexName}
      ON ${tableName} (${columns.join(", ")})
    `;

    try {
      await db.exec`${query}`;
    } catch (error) {
      logError(error as Error, { indexName, tableName, columns });
      throw error;
    }
  }

  // Performance monitoring for queries
  async analyzeQueryPerformance(
    db: SQLDatabase,
    query: string
  ): Promise<any> {
    try {
      const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
      const result = await db.queryRow`${explainQuery}`;
      return result;
    } catch (error) {
      logError(error as Error, { query: "query_analysis" });
      return null;
    }
  }

  // Connection health monitoring
  async checkConnectionHealth(db: SQLDatabase): Promise<{
    isHealthy: boolean;
    responseTime: number;
    activeConnections?: number;
  }> {
    const startTime = Date.now();
    
    try {
      await db.queryRow`SELECT 1 as health_check`;
      const responseTime = Date.now() - startTime;
      
      // Get connection stats if available
      let activeConnections: number | undefined;
      try {
        const stats = await db.queryRow<{ count: number }>`
          SELECT count(*) as count 
          FROM pg_stat_activity 
          WHERE state = 'active'
        `;
        activeConnections = stats?.count;
      } catch {
        // Ignore if we can't get connection stats
      }

      return {
        isHealthy: responseTime < 1000,
        responseTime,
        activeConnections,
      };
    } catch (error) {
      logError(error as Error, { check: "database_health" });
      return {
        isHealthy: false,
        responseTime: Date.now() - startTime,
      };
    }
  }

  // Backup and maintenance utilities
  async performMaintenance(db: SQLDatabase): Promise<void> {
    try {
      // Update table statistics
      await db.exec`ANALYZE`;
      
      // Vacuum if needed (in production, this should be scheduled)
      if (process.env.NODE_ENV !== "production") {
        await db.exec`VACUUM`;
      }
    } catch (error) {
      logError(error as Error, { operation: "database_maintenance" });
    }
  }
}

// Production database indexes for all modules
export const ProductionIndexes = {
  journal: [
    {
      name: "idx_journal_entries_user_created_prod",
      table: "journal_entries",
      columns: ["user_id", "created_at DESC"],
      options: { concurrent: true },
    },
    {
      name: "idx_journal_entries_search_prod",
      table: "journal_entries",
      columns: ["to_tsvector('english', title || ' ' || content)"],
      options: { concurrent: true },
    },
    {
      name: "idx_journal_entries_tags_prod",
      table: "journal_entries",
      columns: ["tags"],
      options: { concurrent: true },
    },
  ],
  meditation: [
    {
      name: "idx_meditation_sessions_user_completed_prod",
      table: "meditation_sessions",
      columns: ["user_id", "completed", "started_at DESC"],
      options: { concurrent: true },
    },
    {
      name: "idx_meditation_sessions_soundscape_prod",
      table: "meditation_sessions",
      columns: ["soundscape", "completed"],
      options: { concurrent: true },
    },
  ],
  codex: [
    {
      name: "idx_codex_entries_user_mode_created_prod",
      table: "resonant_codex_entries",
      columns: ["owner_id", "mode", "created_at DESC"],
      options: { concurrent: true },
    },
    {
      name: "idx_codex_entries_resonance_prod",
      table: "resonant_codex_entries",
      columns: ["resonance_rating DESC", "occurred_at DESC"],
      options: { concurrent: true },
    },
    {
      name: "idx_codex_entries_search_prod",
      table: "resonant_codex_entries",
      columns: ["to_tsvector('english', title || ' ' || (content->>'body'))"],
      options: { concurrent: true },
    },
  ],
  community: [
    {
      name: "idx_shared_learnings_created_prod",
      table: "shared_learnings",
      columns: ["created_at DESC"],
      options: { concurrent: true },
    },
    {
      name: "idx_messages_thread_created_prod",
      table: "messages",
      columns: ["thread_id", "created_at DESC"],
      options: { concurrent: true },
    },
  ],
  ai: [
    {
      name: "idx_ai_conversations_user_updated_prod",
      table: "ai_conversations",
      columns: ["user_id", "updated_at DESC"],
      options: { concurrent: true },
    },
    {
      name: "idx_ai_messages_conversation_created_prod",
      table: "ai_messages",
      columns: ["conversation_id", "created_at ASC"],
      options: { concurrent: true },
    },
  ],
  social: [
    {
      name: "idx_social_posts_author_created_prod",
      table: "social_posts",
      columns: ["author_id", "created_at DESC"],
      options: { concurrent: true },
    },
    {
      name: "idx_social_posts_visibility_created_prod",
      table: "social_posts",
      columns: ["visibility", "created_at DESC"],
      options: { concurrent: true },
    },
  ],
};

// Database migration utilities
export async function applyProductionIndexes(
  databases: Record<string, SQLDatabase>
): Promise<void> {
  const dbManager = DatabaseManager.getInstance();

  for (const [moduleName, indexes] of Object.entries(ProductionIndexes)) {
    const db = databases[moduleName];
    if (!db) continue;

    console.log(`Applying production indexes for ${moduleName}...`);
    
    for (const index of indexes) {
      try {
        await dbManager.createIndexIfNotExists(
          db,
          index.name,
          index.table,
          index.columns,
          index.options
        );
        console.log(`✓ Created index ${index.name}`);
      } catch (error) {
        console.error(`✗ Failed to create index ${index.name}:`, error);
      }
    }
  }
}
