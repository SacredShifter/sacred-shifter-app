// Production middleware for security, rate limiting, and monitoring
import { APIError } from "encore.dev/api";
import { ProductionConfig, environment } from "./production-config";

// Rate limiting store (in production, this would use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Request validation middleware
export function validateRequest(req: any): void {
  // Validate content type for POST/PUT requests
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    const contentType = req.headers["content-type"];
    if (!contentType || !contentType.includes("application/json")) {
      throw APIError.invalidArgument("Content-Type must be application/json");
    }
  }

  // Validate request size (prevent large payloads)
  const contentLength = parseInt(req.headers["content-length"] || "0");
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (contentLength > maxSize) {
    throw APIError.invalidArgument("Request payload too large");
  }

  // Validate required headers
  if (!req.headers["user-agent"]) {
    throw APIError.invalidArgument("User-Agent header is required");
  }
}

// Rate limiting middleware
export function rateLimit(identifier: string): void {
  if (!environment.isProduction) {
    return; // Skip rate limiting in development
  }

  const now = Date.now();
  const windowMs = ProductionConfig.api.rateLimit.windowMs;
  const maxRequests = ProductionConfig.api.rateLimit.max;

  // Clean up expired entries
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }

  // Get or create rate limit entry
  let entry = rateLimitStore.get(identifier);
  if (!entry || now > entry.resetTime) {
    entry = { count: 0, resetTime: now + windowMs };
    rateLimitStore.set(identifier, entry);
  }

  // Check rate limit
  entry.count++;
  if (entry.count > maxRequests) {
    throw APIError.resourceExhausted("Rate limit exceeded").withDetails({
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      limit: maxRequests,
      window: windowMs / 1000,
    });
  }
}

// Input sanitization
export function sanitizeInput(input: any): any {
  if (typeof input === "string") {
    // Remove potentially dangerous characters
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "")
      .trim();
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }

  if (input && typeof input === "object") {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[sanitizeInput(key)] = sanitizeInput(value);
    }
    return sanitized;
  }

  return input;
}

// Error logging and monitoring
export function logError(error: Error, context: any = {}): void {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    context,
  };

  // In production, this would send to monitoring service (Sentry, DataDog, etc.)
  if (environment.isProduction) {
    console.error("[PRODUCTION ERROR]", JSON.stringify(errorInfo, null, 2));
    // TODO: Send to external monitoring service
  } else {
    console.error("[ERROR]", errorInfo);
  }
}

// Performance monitoring
export function measurePerformance<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  
  return fn()
    .then((result) => {
      const duration = Date.now() - startTime;
      logPerformance(operation, duration, true);
      return result;
    })
    .catch((error) => {
      const duration = Date.now() - startTime;
      logPerformance(operation, duration, false);
      throw error;
    });
}

function logPerformance(operation: string, duration: number, success: boolean): void {
  const performanceData = {
    operation,
    duration,
    success,
    timestamp: new Date().toISOString(),
  };

  // Log slow operations
  if (duration > ProductionConfig.monitoring.alerting.responseTimeThreshold) {
    console.warn("[SLOW OPERATION]", performanceData);
  }

  // In production, send to monitoring service
  if (environment.isProduction && ProductionConfig.monitoring.performanceMonitoring) {
    // TODO: Send to external monitoring service
  }
}

// Security headers middleware
export function setSecurityHeaders(): Record<string, string> {
  if (!environment.isProduction) {
    return {};
  }

  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https:; frame-ancestors 'none';",
  };
}

// Request ID generation for tracing
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Health check utilities
export interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  details: string;
  timestamp: Date;
  responseTime: number;
}

export async function performHealthCheck(
  checkName: string,
  checkFn: () => Promise<void>
): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const timestamp = new Date();

  try {
    await checkFn();
    const responseTime = Date.now() - startTime;
    
    return {
      status: responseTime > 1000 ? "degraded" : "healthy",
      details: responseTime > 1000 ? "Slow response time" : "All systems operational",
      timestamp,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logError(error as Error, { healthCheck: checkName });
    
    return {
      status: "unhealthy",
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp,
      responseTime,
    };
  }
}

// Database connection health check
export async function checkDatabaseHealth(db: any): Promise<void> {
  await db.queryRow`SELECT 1 as health_check`;
}

// Memory usage monitoring
export function getMemoryUsage(): {
  used: number;
  total: number;
  percentage: number;
} {
  const usage = process.memoryUsage();
  const total = usage.heapTotal;
  const used = usage.heapUsed;
  const percentage = (used / total) * 100;

  return { used, total, percentage };
}

// Graceful shutdown handler
export function setupGracefulShutdown(): void {
  const shutdown = (signal: string) => {
    console.log(`Received ${signal}. Starting graceful shutdown...`);
    
    // Give ongoing requests time to complete
    setTimeout(() => {
      console.log("Graceful shutdown completed");
      process.exit(0);
    }, 10000); // 10 seconds
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}
