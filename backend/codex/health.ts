import { api } from "encore.dev/api";
import { CodexService } from "./service";
import { getModuleConfig } from "../shared/config";
import type { ServiceHealth } from "../shared/types";

const codexService = new CodexService();

// Health check endpoint for the codex module.
export const health = api<void, ServiceHealth>(
  { expose: true, method: "GET", path: "/codex/health" },
  async () => {
    const config = getModuleConfig('codex');
    const healthCheck = await codexService.healthCheck();
    
    return {
      service: config.name,
      status: healthCheck.status,
      version: config.version,
      uptime: process.uptime()
    };
  }
);
