import { api } from "encore.dev/api";
import { CodexService } from "./service";
import type { CodexAnalytics } from "./types";

const codexService = new CodexService();

// Retrieves codex analytics for the current user.
export const getAnalytics = api<void, CodexAnalytics>(
  { expose: true, method: "GET", path: "/codex/analytics" },
  async () => {
    const userId = "default-user"; // Use default user since no auth
    return await codexService.getAnalytics(userId);
  }
);
