import { SQLDatabase } from "encore.dev/storage/sqldb";

export const socialDB = new SQLDatabase("sacred_social", {
  migrations: "./migrations",
});
