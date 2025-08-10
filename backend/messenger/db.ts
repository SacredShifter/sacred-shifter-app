import { SQLDatabase } from "encore.dev/storage/sqldb";

// The 'sacred_social' database is defined in the 'social' service.
// We use .named() to get a reference to it.
export const db = SQLDatabase.named("sacred_social");
