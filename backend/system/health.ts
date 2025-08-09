import { api } from "encore.dev/api";
import { ModuleConfigs } from "../shared/config";
import type { ServiceHealth } from "../shared/types";

interface SystemHealthResponse {
  system: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: Date;
    uptime: number;
  };
  modules: ServiceHealth[];
}

// System-wide health check that aggregates all module health statuses.
export const systemHealth = api<void, SystemHealthResponse>(
  { expose: true, method: "GET", path: "/system/health" },
  async () => {
    const moduleHealthChecks: ServiceHealth[] = [];
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Check each module's health
    for (const [moduleName, config] of Object.entries(ModuleConfigs)) {
      try {
        // Make HTTP request to each module's health endpoint
        const response = await fetch(`http://localhost:4000/${moduleName}/health`);
        if (response.ok) {
          const health = await response.json() as ServiceHealth;
          moduleHealthChecks.push(health);
          
          if (health.status === 'unhealthy') {
            overallStatus = 'unhealthy';
          } else if (health.status === 'degraded' && overallStatus === 'healthy') {
            overallStatus = 'degraded';
          }
        } else {
          moduleHealthChecks.push({
            service: config.name,
            status: 'unhealthy',
            version: config.version,
            uptime: 0
          });
          overallStatus = 'unhealthy';
        }
      } catch (error) {
        moduleHealthChecks.push({
          service: config.name,
          status: 'unhealthy',
          version: config.version,
          uptime: 0
        });
        overallStatus = 'unhealthy';
      }
    }

    return {
      system: {
        status: overallStatus,
        timestamp: new Date(),
        uptime: process.uptime()
      },
      modules: moduleHealthChecks
    };
  }
);
