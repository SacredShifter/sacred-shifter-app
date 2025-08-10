import { SQLDatabase } from "encore.dev/storage/sqldb";

export const journalDB = new SQLDatabase("journal_entries", {
  migrations: "./migrations",
});
