import { SQLDatabase } from "encore.dev/storage/sqldb";

export const codexDB = new SQLDatabase("sacred_codex", {
  migrations: "./migrations",
});
