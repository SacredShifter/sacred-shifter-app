import { api } from "encore.dev/api";
import { JournalService } from "./service";
import { getModuleConfig } from "../shared/config";
import type { ServiceHealth } from "../shared/types";

const journalService = new JournalService();

// Health check endpoint for the journal module.
export const health = api<void, ServiceHealth>(
  { expose: true, method: "GET", path: "/journal/health" },
  async () => {
    const config = getModuleConfig('journal');
    const healthCheck = await journalService.healthCheck();
    
    return {
      service: config.name,
      status: healthCheck.status,
      version: config.version,
      uptime: process.uptime()
    };
  }
);
