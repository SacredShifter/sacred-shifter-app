import { SQLDatabase } from "encore.dev/storage/sqldb";

export const communityDB = new SQLDatabase("community_data", {
  migrations: "./migrations",
});
