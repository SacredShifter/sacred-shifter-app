import { SQLDatabase } from "encore.dev/storage/sqldb";

export const communityDB = new SQLDatabase("community", {
  migrations: "./migrations",
});
