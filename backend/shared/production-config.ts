// Production configuration management

// Environment detection
export const environment = {
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
  isStaging: process.env.NODE_ENV === "staging",
};

// Production defaults with fallbacks
export const ProductionConfig = {
  database: {
    maxConnections: environment.isProduction ? 100 : 20,
    connectionTimeout: 30000,
    queryTimeout: 60000,
    ssl: environment.isProduction,
    retryAttempts: 3,
  },
  api: {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: environment.isProduction ? 100 : 1000, // Stricter in production
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    },
    cors: {
      origin: environment.isProduction 
        ? ["https://sacred-shifter.app", "https://www.sacred-shifter.app"]
        : ["http://localhost:3000", "http://localhost:5173"],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    },
    security: {
      helmet: {
        contentSecurityPolicy: environment.isProduction,
        crossOriginEmbedderPolicy: environment.isProduction,
        crossOriginOpenerPolicy: environment.isProduction,
        crossOriginResourcePolicy: environment.isProduction,
        dnsPrefetchControl: true,
        frameguard: { action: "deny" },
        hidePoweredBy: true,
        hsts: environment.isProduction,
        ieNoOpen: true,
        noSniff: true,
        originAgentCluster: true,
        permittedCrossDomainPolicies: false,
        referrerPolicy: { policy: "no-referrer" },
        xssFilter: true,
      },
    },
  },
  ai: {
    maxTokens: 2000,
    timeout: 30000,
    retryAttempts: 3,
    cacheEnabled: true,
    cacheTTL: 3600, // 1 hour
    rateLimiting: {
      requestsPerMinute: environment.isProduction ? 60 : 120,
      tokensPerHour: environment.isProduction ? 100000 : 200000,
    },
  },
  monitoring: {
    errorTracking: environment.isProduction,
    performanceMonitoring: environment.isProduction,
    logLevel: environment.isProduction ? "info" : "debug",
    metricsEnabled: true,
    healthCheckInterval: 30000, // 30 seconds
    alerting: {
      errorThreshold: 0.01, // 1% error rate
      responseTimeThreshold: 2000, // 2 seconds
      uptimeThreshold: 0.999, // 99.9% uptime
    },
  },
  cache: {
    redis: {
      enabled: environment.isProduction,
      ttl: 3600, // 1 hour default
      maxMemory: "256mb",
    },
    memory: {
      enabled: true,
      maxSize: 100, // 100 items
      ttl: 300, // 5 minutes
    },
  },
};
