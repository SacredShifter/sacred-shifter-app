import { SQLDatabase } from "encore.dev/storage/sqldb";
import { ProductionIndexes, DatabaseManager } from "../shared/database-optimization";
import { aiDB } from '../ai/db';
import { codexDB } from '../codex/db';
import { communityDB } from '../community/db';
import { journalDB } from '../journal/db';
import { meditationDB } from '../meditation/db';
import { socialDB } from '../social/db';
import { db as messengerDB } from '../messenger/db';

async function applyIndexesForModule(
  db: SQLDatabase,
  moduleName: string,
  indexes: any[],
  details: string[],
  dbManager: DatabaseManager
) {
  details.push(`\nApplying indexes for ${moduleName}...`);
  for (const index of indexes) {
    try {
      await dbManager.createIndexIfNotExists(
        db,
        index.name,
        index.table,
        index.columns,
        index.options
      );
      details.push(`  ✓ Created index ${index.name} on ${index.table}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      details.push(`  ✗ Failed to create index ${index.name}: ${errorMessage}`);
    }
  }
}

async function main() {
  console.log('Applying production database indexes...');
  const details: string[] = [];
  const dbManager = DatabaseManager.getInstance();
  
  details.push('Applying production database indexes...');

  await applyIndexesForModule(aiDB, 'ai', ProductionIndexes.ai, details, dbManager);
  await applyIndexesForModule(codexDB, 'codex', ProductionIndexes.codex, details, dbManager);
  await applyIndexesForModule(communityDB, 'community', ProductionIndexes.community, details, dbManager);
  await applyIndexesForModule(journalDB, 'journal', ProductionIndexes.journal, details, dbManager);
  await applyIndexesForModule(meditationDB, 'meditation', ProductionIndexes.meditation, details, dbManager);
  await applyIndexesForModule(socialDB, 'social', ProductionIndexes.social, details, dbManager);
  await applyIndexesForModule(messengerDB, 'messenger', ProductionIndexes.messenger, details, dbManager);
  
  details.push('\nProduction database indexes application complete.');
  console.log(details.join('\n'));
}

main().catch(err => {
  console.error('Failed to apply production indexes:', err);
  process.exit(1);
});
