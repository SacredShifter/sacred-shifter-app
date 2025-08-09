import { api } from "encore.dev/api";
import { MeditationService } from "./service";
import type { MeditationAnalytics } from "./types";

const meditationService = new MeditationService();

// Retrieves meditation analytics for the current user.
export const getAnalytics = api<void, MeditationAnalytics>(
  { expose: true, method: "GET", path: "/meditation/analytics" },
  async () => {
    const userId = "default-user"; // Use default user since no auth
    return await meditationService.getAnalytics(userId);
  }
);
