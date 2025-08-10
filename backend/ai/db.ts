import { SQLDatabase } from "encore.dev/storage/sqldb";

export const aiDB = new SQLDatabase("sacred_ai", {
  migrations: "./migrations",
});
