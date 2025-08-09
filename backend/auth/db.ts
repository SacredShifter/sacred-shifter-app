import { SQLDatabase } from "encore.dev/storage/sqldb";

export const authDB = new SQLDatabase("sacred_shifter", {
  migrations: "./migrations",
});
