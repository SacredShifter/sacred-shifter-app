import { api } from "encore.dev/api";
import { JournalService } from "./service";
import type { JournalAnalytics } from "./types";

const journalService = new JournalService();

// Retrieves journal analytics for the current user.
export const getAnalytics = api<void, JournalAnalytics>(
  { expose: true, method: "GET", path: "/journal/analytics" },
  async () => {
    const userId = "default-user"; // Use default user since no auth
    return await journalService.getAnalytics(userId);
  }
);
