import { SQLDatabase } from "encore.dev/storage/sqldb";

export const aiDB = new SQLDatabase("ai_assistant", {
  migrations: "./migrations",
});
