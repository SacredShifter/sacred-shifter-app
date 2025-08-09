import { api } from "encore.dev/api";
import { CodexService } from "./service";
import type {
  ShareCodexEntryRequest,
  ReactToCodexEntryRequest,
  FindSimilarEntriesRequest,
  FindSimilarEntriesResponse
} from "./types";

const codexService = new CodexService();

// Shares a codex entry with another user.
export const shareEntry = api<ShareCodexEntryRequest, void>(
  { expose: true, method: "POST", path: "/codex/entries/:entry_id/share" },
  async (req) => {
    const userId = "default-user"; // Use default user since no auth
    await codexService.shareEntry(userId, req);
  }
);

// Unshares a codex entry from a user.
export const unshareEntry = api<{ entry_id: string; user_id: string }, void>(
  { expose: true, method: "DELETE", path: "/codex/entries/:entry_id/share/:user_id" },
  async ({ entry_id, user_id }) => {
    const userId = "default-user"; // Use default user since no auth
    await codexService.unshareEntry(userId, entry_id, user_id);
  }
);

// Reacts to a codex entry.
export const reactToEntry = api<ReactToCodexEntryRequest, void>(
  { expose: true, method: "POST", path: "/codex/entries/:entry_id/react" },
  async (req) => {
    const userId = "default-user"; // Use default user since no auth
    await codexService.reactToEntry(userId, req);
  }
);

// Finds similar entries to a given entry.
export const findSimilarEntries = api<FindSimilarEntriesRequest, FindSimilarEntriesResponse>(
  { expose: true, method: "GET", path: "/codex/entries/:entry_id/similar" },
  async (req) => {
    const userId = "default-user"; // Use default user since no auth
    return await codexService.findSimilarEntries(userId, req);
  }
);
