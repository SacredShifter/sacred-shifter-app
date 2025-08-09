import { SQLDatabase } from "encore.dev/storage/sqldb";

export const meditationDB = new SQLDatabase("meditation", {
  migrations: "./migrations",
});
