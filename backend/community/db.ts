import { SQLDatabase } from "encore.dev/storage/sqldb";

export const communityDB = new SQLDatabase("sacred_community", {
  migrations: "./migrations",
});
