import { api } from "encore.dev/api";
import { SocialService } from "./service";
import { getModuleConfig } from "../shared/config";
import type { ServiceHealth } from "../shared/types";

const socialService = new SocialService();

// Health check endpoint for the social module.
export const health = api<void, ServiceHealth>(
  { expose: true, method: "GET", path: "/social/health" },
  async () => {
    const config = getModuleConfig('social');
    const healthCheck = await socialService.healthCheck();
    
    return {
      service: config.name,
      status: healthCheck.status,
      version: config.version,
      uptime: process.uptime()
    };
  }
);
