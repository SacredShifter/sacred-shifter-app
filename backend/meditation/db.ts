import { SQLDatabase } from "encore.dev/storage/sqldb";

export const meditationDB = new SQLDatabase("meditation_sessions", {
  migrations: "./migrations",
});
