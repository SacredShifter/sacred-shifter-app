import { SQLDatabase } from "encore.dev/storage/sqldb";

export const meditationDB = new SQLDatabase("sacred_meditation", {
  migrations: "./migrations",
});
