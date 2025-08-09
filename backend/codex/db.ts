import { SQLDatabase } from "encore.dev/storage/sqldb";

export const codexDB = new SQLDatabase("codex", {
  migrations: "./migrations",
});
