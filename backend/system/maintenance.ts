import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { ProductionIndexes, DatabaseManager } from "../shared/database-optimization";
import { aiDB } from '../ai/db';
import { codexDB } from '../codex/db';
import { communityDB } from '../community/db';
import { journalDB } from '../journal/db';
import { meditationDB } from '../meditation/db';
import { socialDB } from '../social/db';

interface ApplyIndexesResponse {
  success: boolean;
  details: string[];
}

// Applies production database indexes. This is an internal administrative endpoint.
export const applyProductionIndexes = api<void, ApplyIndexesResponse>(
  { method: "POST", path: "/system/maintenance/apply-indexes" },
  async () => {
    const details: string[] = [];
    const dbManager = DatabaseManager.getInstance();
    const databases: Record<string, SQLDatabase> = {
      ai: aiDB,
      codex: codexDB,
      community: communityDB,
      journal: journalDB,
      meditation: meditationDB,
      social: socialDB,
    };

    details.push('Applying production database indexes...');

    for (const [moduleName, indexes] of Object.entries(ProductionIndexes)) {
      const db = databases[moduleName];
      if (!db) continue;

      details.push(`Applying indexes for ${moduleName}...`);
      
      for (const index of indexes) {
        try {
          await dbManager.createIndexIfNotExists(
            db,
            index.name,
            index.table,
            index.columns,
            index.options
          );
          details.push(`✓ Created index ${index.name}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          details.push(`✗ Failed to create index ${index.name}: ${errorMessage}`);
        }
      }
    }
    
    details.push('Production database indexes application complete.');
    return { success: true, details };
  }
);
