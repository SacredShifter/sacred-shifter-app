import { SQLDatabase } from "encore.dev/storage/sqldb";

export const journalDB = new SQLDatabase("sacred_journal", {
  migrations: "./migrations",
});
