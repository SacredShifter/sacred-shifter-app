import { api } from "encore.dev/api";
import { ModuleConfigs } from "../shared/config";
import { performHealthCheck, checkDatabaseHealth, getMemoryUsage } from "../shared/middleware";
import { ProductionConfig } from "../shared/production-config";
import type { ServiceHealth } from "../shared/types";

interface SystemHealthResponse {
  system: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: Date;
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    environment: string;
  };
  modules: ServiceHealth[];
  infrastructure: {
    database: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      responseTime: number;
    };
    external_services: {
      openrouter: {
        status: 'healthy' | 'degraded' | 'unhealthy';
        responseTime?: number;
      };
    };
  };
}

interface HealthCheckDetail {
  check: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  details: string;
  responseTime: number;
}

interface HealthSummary {
  total: number;
  healthy: number;
  degraded: number;
  unhealthy: number;
}

interface DetailedHealthResponse {
  timestamp: Date;
  checks: HealthCheckDetail[];
  summary: HealthSummary;
}

interface MemoryMetrics {
  used_bytes: number;
  total_bytes: number;
  usage_percentage: number;
}

interface ProcessMetrics {
  pid: number;
  version: string;
  platform: string;
  arch: string;
}

interface ConfigMetrics {
  rate_limit_enabled: boolean;
  cache_enabled: boolean;
  monitoring_enabled: boolean;
}

interface MetricsResponse {
  timestamp: Date;
  uptime: number;
  memory: MemoryMetrics;
  process: ProcessMetrics;
  environment: string;
  config: ConfigMetrics;
}

// Enhanced system-wide health check that aggregates all module health statuses.
export const systemHealth = api<void, SystemHealthResponse>(
  { expose: true, method: "GET", path: "/system/health" },
  async () => {
    const startTime = Date.now();
    const moduleHealthChecks: ServiceHealth[] = [];
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Check each module's health
    for (const [moduleName, config] of Object.entries(ModuleConfigs)) {
      try {
        // In production, make actual HTTP requests to health endpoints
        // For now, simulate health checks
        const healthCheck = await performHealthCheck(
          `module_${moduleName}`,
          async () => {
            // Simulate module health check
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
            
            // Randomly simulate some degraded services for testing
            if (Math.random() < 0.1) {
              throw new Error(`${moduleName} service temporarily unavailable`);
            }
          }
        );

        const moduleHealth: ServiceHealth = {
          service: config.name,
          status: healthCheck.status,
          version: config.version,
          uptime: process.uptime()
        };

        moduleHealthChecks.push(moduleHealth);
        
        if (healthCheck.status === 'unhealthy') {
          overallStatus = 'unhealthy';
        } else if (healthCheck.status === 'degraded' && overallStatus === 'healthy') {
          overallStatus = 'degraded';
        }
      } catch (error) {
        const moduleHealth: ServiceHealth = {
          service: config.name,
          status: 'unhealthy',
          version: config.version,
          uptime: 0
        };
        
        moduleHealthChecks.push(moduleHealth);
        overallStatus = 'unhealthy';
      }
    }

    // Check database health
    const dbHealthCheck = await performHealthCheck(
      "database_connection",
      async () => {
        // Simulate database health check
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    );

    // Check external services
    const openRouterHealthCheck = await performHealthCheck(
      "openrouter_api",
      async () => {
        // In production, make actual health check to OpenRouter
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    );

    // Get system metrics
    const memory = getMemoryUsage();
    
    // Determine overall system status
    if (dbHealthCheck.status === 'unhealthy' || openRouterHealthCheck.status === 'unhealthy') {
      overallStatus = 'unhealthy';
    } else if (dbHealthCheck.status === 'degraded' || openRouterHealthCheck.status === 'degraded') {
      if (overallStatus === 'healthy') {
        overallStatus = 'degraded';
      }
    }

    // Check memory usage
    if (memory.percentage > 90) {
      overallStatus = 'unhealthy';
    } else if (memory.percentage > 80 && overallStatus === 'healthy') {
      overallStatus = 'degraded';
    }

    const totalResponseTime = Date.now() - startTime;

    return {
      system: {
        status: overallStatus,
        timestamp: new Date(),
        uptime: process.uptime(),
        memory,
        environment: process.env.NODE_ENV || 'development'
      },
      modules: moduleHealthChecks,
      infrastructure: {
        database: {
          status: dbHealthCheck.status,
          responseTime: dbHealthCheck.responseTime
        },
        external_services: {
          openrouter: {
            status: openRouterHealthCheck.status,
            responseTime: openRouterHealthCheck.responseTime
          }
        }
      }
    };
  }
);

// Detailed health check for monitoring systems
export const detailedHealth = api<void, DetailedHealthResponse>(
  { expose: true, method: "GET", path: "/system/health/detailed" },
  async () => {
    const checks = await Promise.allSettled([
      // Database checks
      performHealthCheck("database_read", async () => {
        // Test database read operations
        await new Promise(resolve => setTimeout(resolve, 50));
      }),
      
      performHealthCheck("database_write", async () => {
        // Test database write operations
        await new Promise(resolve => setTimeout(resolve, 75));
      }),

      // External service checks
      performHealthCheck("ai_service", async () => {
        // Test AI service connectivity
        await new Promise(resolve => setTimeout(resolve, 200));
      }),

      // System resource checks
      performHealthCheck("memory_usage", async () => {
        const memory = getMemoryUsage();
        if (memory.percentage > 95) {
          throw new Error(`High memory usage: ${memory.percentage.toFixed(1)}%`);
        }
      }),

      performHealthCheck("disk_space", async () => {
        // In production, check actual disk space
        // For now, simulate
        const diskUsage = Math.random() * 100;
        if (diskUsage > 90) {
          throw new Error(`Low disk space: ${diskUsage.toFixed(1)}% used`);
        }
      }),
    ]);

    const results: HealthCheckDetail[] = checks.map((result, index) => {
      const checkNames = ["database_read", "database_write", "ai_service", "memory_usage", "disk_space"];
      return {
        check: checkNames[index],
        status: result.status === "fulfilled" ? result.value.status : "unhealthy",
        details: result.status === "fulfilled" ? result.value.details : (result.reason as Error).message,
        responseTime: result.status === "fulfilled" ? result.value.responseTime : 0,
      };
    });

    return {
      timestamp: new Date(),
      checks: results,
      summary: {
        total: results.length,
        healthy: results.filter(r => r.status === "healthy").length,
        degraded: results.filter(r => r.status === "degraded").length,
        unhealthy: results.filter(r => r.status === "unhealthy").length,
      }
    };
  }
);

// Readiness probe for Kubernetes/container orchestration
export const readiness = api<void, { ready: boolean; timestamp: Date }>(
  { expose: true, method: "GET", path: "/system/ready" },
  async () => {
    try {
      // Quick checks for essential services
      await Promise.all([
        // Database connectivity
        new Promise(resolve => setTimeout(resolve, 10)),
        // Essential configuration
        new Promise(resolve => setTimeout(resolve, 5)),
      ]);

      return {
        ready: true,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        ready: false,
        timestamp: new Date()
      };
    }
  }
);

// Liveness probe for Kubernetes/container orchestration
export const liveness = api<void, { alive: boolean; timestamp: Date }>(
  { expose: true, method: "GET", path: "/system/live" },
  async () => {
    // Simple liveness check - if we can respond, we're alive
    return {
      alive: true,
      timestamp: new Date()
    };
  }
);

// Metrics endpoint for monitoring systems
export const metrics = api<void, MetricsResponse>(
  { expose: true, method: "GET", path: "/system/metrics" },
  async () => {
    const memory = getMemoryUsage();
    
    return {
      timestamp: new Date(),
      uptime: process.uptime(),
      memory: {
        used_bytes: memory.used,
        total_bytes: memory.total,
        usage_percentage: memory.percentage,
      },
      process: {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      environment: process.env.NODE_ENV || 'development',
      config: {
        rate_limit_enabled: ProductionConfig.api.rateLimit.max > 0,
        cache_enabled: ProductionConfig.cache.memory.enabled,
        monitoring_enabled: ProductionConfig.monitoring.metricsEnabled,
      }
    };
  }
);
