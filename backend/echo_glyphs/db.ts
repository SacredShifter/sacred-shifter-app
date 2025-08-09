import { SQLDatabase } from "encore.dev/storage/sqldb";

export const echoGlyphsDB = new SQLDatabase("echo_glyphs", {
  migrations: "./migrations",
});
