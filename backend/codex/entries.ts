import { api } from "encore.dev/api";
import { CodexService } from "./service";
import type {
  CodexEntry,
  CreateCodexEntryRequest,
  UpdateCodexEntryRequest,
  ListCodexEntriesRequest,
  ListCodexEntriesResponse
} from "./types";

const codexService = new CodexService();

// Creates a new codex entry.
export const createEntry = api<CreateCodexEntryRequest, CodexEntry>(
  { expose: true, method: "POST", path: "/codex/entries" },
  async (req) => {
    const userId = "default-user"; // Use default user since no auth
    return await codexService.createEntry(userId, req);
  }
);

// Updates an existing codex entry.
export const updateEntry = api<UpdateCodexEntryRequest, CodexEntry>(
  { expose: true, method: "PUT", path: "/codex/entries/:id" },
  async (req) => {
    const userId = "default-user"; // Use default user since no auth
    return await codexService.updateEntry(userId, req);
  }
);

// Deletes a codex entry.
export const deleteEntry = api<{ id: string }, void>(
  { expose: true, method: "DELETE", path: "/codex/entries/:id" },
  async ({ id }) => {
    const userId = "default-user"; // Use default user since no auth
    await codexService.deleteEntry(userId, id);
  }
);

// Retrieves a specific codex entry.
export const getEntry = api<{ id: string }, CodexEntry>(
  { expose: true, method: "GET", path: "/codex/entries/:id" },
  async ({ id }) => {
    const userId = "default-user"; // Use default user since no auth
    const entry = await codexService.getEntry(userId, id);
    if (!entry) {
      throw new Error("Codex entry not found");
    }
    return entry;
  }
);

// Retrieves all codex entries for the current user.
export const listEntries = api<ListCodexEntriesRequest, ListCodexEntriesResponse>(
  { expose: true, method: "GET", path: "/codex/entries" },
  async (req) => {
    const userId = "default-user"; // Use default user since no auth
    return await codexService.listEntries(userId, req);
  }
);
