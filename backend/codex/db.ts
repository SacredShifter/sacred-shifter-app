import { SQLDatabase } from "encore.dev/storage/sqldb";

export const codexDB = new SQLDatabase("resonant_codex", {
  migrations: "./migrations",
});
