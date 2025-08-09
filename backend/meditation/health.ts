import { api } from "encore.dev/api";
import { MeditationService } from "./service";
import { getModuleConfig } from "../shared/config";
import type { ServiceHealth } from "../shared/types";

const meditationService = new MeditationService();

// Health check endpoint for the meditation module.
export const health = api<void, ServiceHealth>(
  { expose: true, method: "GET", path: "/meditation/health" },
  async () => {
    const config = getModuleConfig('meditation');
    const healthCheck = await meditationService.healthCheck();
    
    return {
      service: config.name,
      status: healthCheck.status,
      version: config.version,
      uptime: process.uptime()
    };
  }
);
