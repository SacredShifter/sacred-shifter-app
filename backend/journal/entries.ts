import { api } from "encore.dev/api";
import { JournalService } from "./service";
import type { 
  JournalEntry,
  CreateJournalEntryRequest,
  UpdateJournalEntryRequest,
  ListJournalEntriesRequest,
  ListJournalEntriesResponse
} from "./types";

const journalService = new JournalService();

// Creates a new journal entry.
export const createEntry = api<CreateJournalEntryRequest, JournalEntry>(
  { expose: true, method: "POST", path: "/journal/entries" },
  async (req) => {
    const userId = "default-user"; // Use default user since no auth
    return await journalService.createEntry(userId, req);
  }
);

// Updates an existing journal entry.
export const updateEntry = api<UpdateJournalEntryRequest, JournalEntry>(
  { expose: true, method: "PUT", path: "/journal/entries/:id" },
  async (req) => {
    const userId = "default-user"; // Use default user since no auth
    return await journalService.updateEntry(userId, req);
  }
);

// Deletes a journal entry.
export const deleteEntry = api<{ id: string }, void>(
  { expose: true, method: "DELETE", path: "/journal/entries/:id" },
  async ({ id }) => {
    const userId = "default-user"; // Use default user since no auth
    await journalService.deleteEntry(userId, id);
  }
);

// Retrieves a specific journal entry.
export const getEntry = api<{ id: string }, JournalEntry>(
  { expose: true, method: "GET", path: "/journal/entries/:id" },
  async ({ id }) => {
    const userId = "default-user"; // Use default user since no auth
    const entry = await journalService.getEntry(userId, id);
    if (!entry) {
      throw new Error("Journal entry not found");
    }
    return entry;
  }
);

// Retrieves all journal entries for the current user.
export const listEntries = api<ListJournalEntriesRequest, ListJournalEntriesResponse>(
  { expose: true, method: "GET", path: "/journal/entries" },
  async (req) => {
    const userId = "default-user"; // Use default user since no auth
    return await journalService.listEntries(userId, req);
  }
);
