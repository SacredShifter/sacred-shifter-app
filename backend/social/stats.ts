import { api } from "encore.dev/api";
import { SocialService } from "./service";
import type { SocialStats } from "./types";

const socialService = new SocialService();

// Gets social network statistics.
export const getStats = api<void, SocialStats>(
  { expose: true, method: "GET", path: "/social/stats" },
  async () => {
    return await socialService.getStats();
  }
);
