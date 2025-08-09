import { SQLDatabase } from "encore.dev/storage/sqldb";

export const db = new SQLDatabase("sacred_shifter", {
  migrations: "./migrations",
});
