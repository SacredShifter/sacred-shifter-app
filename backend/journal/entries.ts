import { api, APIError } from "encore.dev/api";
import { journalDB } from "./db";

export interface JournalEntry {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: Date;
  updated_at: Date;
}

interface CreateJournalEntryRequest {
  title: string;
  content: string;
}

interface UpdateJournalEntryRequest {
  id: string;
  title: string;
  content: string;
}

interface ListJournalEntriesResponse {
  entries: JournalEntry[];
}

// Creates a new journal entry.
export const createEntry = api<CreateJournalEntryRequest, JournalEntry>(
  { expose: true, method: "POST", path: "/journal/entries" },
  async (req) => {
    const { title, content } = req;
    const userId = "default-user"; // Use default user since no auth

    const entry = await journalDB.queryRow<JournalEntry>`
      INSERT INTO journal_entries (user_id, title, content)
      VALUES (${userId}, ${title}, ${content})
      RETURNING id, user_id, title, content, created_at, updated_at
    `;

    if (!entry) {
      throw APIError.internal("failed to create journal entry");
    }

    return entry;
  }
);

// Retrieves all journal entries for the current user.
export const listEntries = api<void, ListJournalEntriesResponse>(
  { expose: true, method: "GET", path: "/journal/entries" },
  async () => {
    const userId = "default-user"; // Use default user since no auth

    const entries = await journalDB.queryAll<JournalEntry>`
      SELECT id, user_id, title, content, created_at, updated_at
      FROM journal_entries
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    return { entries };
  }
);

// Updates an existing journal entry.
export const updateEntry = api<UpdateJournalEntryRequest, JournalEntry>(
  { expose: true, method: "PUT", path: "/journal/entries/:id" },
  async (req) => {
    const { id, title, content } = req;
    const userId = "default-user"; // Use default user since no auth

    const entry = await journalDB.queryRow<JournalEntry>`
      UPDATE journal_entries
      SET title = ${title}, content = ${content}, updated_at = NOW()
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING id, user_id, title, content, created_at, updated_at
    `;

    if (!entry) {
      throw APIError.notFound("journal entry not found");
    }

    return entry;
  }
);

// Deletes a journal entry.
export const deleteEntry = api<{ id: string }, void>(
  { expose: true, method: "DELETE", path: "/journal/entries/:id" },
  async ({ id }) => {
    const userId = "default-user"; // Use default user since no auth

    await journalDB.exec`
      DELETE FROM journal_entries
      WHERE id = ${id} AND user_id = ${userId}
    `;
  }
);
