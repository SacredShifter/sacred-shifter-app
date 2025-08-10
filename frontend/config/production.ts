// Production configuration for frontend
export const productionConfig = {
  api: {
    baseUrl: process.env.REACT_APP_API_BASE_URL || 'https://api.sacred-shifter.app',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  supabase: {
    url: process.env.REACT_APP_SUPABASE_URL || '',
    anonKey: process.env.REACT_APP_SUPABASE_ANON_KEY || '',
    realtime: {
      enabled: true,
      heartbeatIntervalMs: 30000,
      reconnectAfterMs: 1000,
    },
  },
  features: {
    enableAnalytics: process.env.NODE_ENV === 'production',
    enableErrorTracking: process.env.NODE_ENV === 'production',
    enablePerformanceMonitoring: process.env.NODE_ENV === 'production',
    enableA11y: true,
    enableServiceWorker: process.env.NODE_ENV === 'production',
  },
  performance: {
    lazyLoading: true,
    imageOptimization: true,
    bundleSplitting: true,
    caching: true,
    prefetchRoutes: process.env.NODE_ENV === 'production',
  },
  security: {
    enableCSP: process.env.NODE_ENV === 'production',
    enableHSTS: process.env.NODE_ENV === 'production',
    enableXSSProtection: true,
    enableFrameGuard: true,
  },
  monitoring: {
    logLevel: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
    enableConsoleLogging: process.env.NODE_ENV !== 'production',
    enableRemoteLogging: process.env.NODE_ENV === 'production',
    errorReportingThreshold: 'error',
  },
  cache: {
    enableServiceWorker: process.env.NODE_ENV === 'production',
    cacheStrategy: 'stale-while-revalidate',
    maxAge: 3600, // 1 hour
    enableOfflineMode: true,
  },
  ui: {
    enableAnimations: true,
    enableTransitions: true,
    enableHapticFeedback: 'ontouchstart' in window,
    theme: {
      enableDarkMode: true,
      enableSystemTheme: true,
      enableCustomThemes: true,
    },
  },
};

// Environment detection
export const environment = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isStaging: process.env.NODE_ENV === 'staging',
  isTest: process.env.NODE_ENV === 'test',
};

// Feature flags based on environment
export const featureFlags = {
  // Core features
  enableAIAssistant: true,
  enableMessenger: true,
  enableSocialNetwork: true,
  enableCodex: true,
  enableJournal: true,
  enableMeditation: true,
  enableCommunity: true,
  
  // Advanced features
  enableVoiceMessages: environment.isProduction,
  enableVideoChat: false, // Not yet implemented
  enableFileSharing: true,
  enableNotifications: true,
  enableOfflineMode: environment.isProduction,
  
  // Experimental features
  enableBetaFeatures: environment.isDevelopment,
  enableDebugMode: environment.isDevelopment,
  enablePerformanceMetrics: environment.isProduction,
  
  // Security features
  enableRateLimiting: environment.isProduction,
  enableInputSanitization: true,
  enableCSRFProtection: environment.isProduction,
  enableContentSecurityPolicy: environment.isProduction,
};

// API endpoints configuration
export const apiEndpoints = {
  base: productionConfig.api.baseUrl,
  health: '/system/health',
  ready: '/system/ready',
  metrics: '/system/metrics',
  
  // Module endpoints
  ai: '/ai',
  journal: '/journal',
  meditation: '/meditation',
  community: '/community',
  codex: '/codex',
  social: '/social',
};

// Error messages for production
export const errorMessages = {
  network: {
    offline: 'You appear to be offline. Please check your connection.',
    timeout: 'Request timed out. Please try again.',
    serverError: 'Server error occurred. Please try again later.',
    rateLimited: 'Too many requests. Please wait a moment before trying again.',
  },
  validation: {
    required: 'This field is required.',
    invalid: 'Please enter a valid value.',
    tooLong: 'This value is too long.',
    tooShort: 'This value is too short.',
  },
  auth: {
    unauthorized: 'You need to be logged in to access this feature.',
    forbidden: 'You do not have permission to perform this action.',
    sessionExpired: 'Your session has expired. Please log in again.',
  },
  generic: {
    unknown: 'An unexpected error occurred. Please try again.',
    maintenance: 'The system is currently under maintenance. Please try again later.',
  },
};

// Performance thresholds
export const performanceThresholds = {
  // Page load times (milliseconds)
  pageLoad: {
    good: 1000,
    needsImprovement: 2500,
    poor: 4000,
  },
  
  // API response times (milliseconds)
  apiResponse: {
    good: 500,
    needsImprovement: 1000,
    poor: 2000,
  },
  
  // Bundle sizes (bytes)
  bundleSize: {
    initial: 250000, // 250KB
    chunk: 100000,   // 100KB
    total: 1000000,  // 1MB
  },
  
  // Memory usage (MB)
  memory: {
    warning: 50,
    critical: 100,
  },
};

// Analytics configuration
export const analyticsConfig = {
  enabled: environment.isProduction,
  trackPageViews: true,
  trackUserInteractions: true,
  trackPerformance: true,
  trackErrors: true,
  
  // Events to track
  events: {
    // User actions
    userSignup: 'user_signup',
    userLogin: 'user_login',
    userLogout: 'user_logout',
    
    // Feature usage
    journalEntryCreated: 'journal_entry_created',
    meditationStarted: 'meditation_started',
    aiChatStarted: 'ai_chat_started',
    codexEntryCreated: 'codex_entry_created',
    
    // Engagement
    pageView: 'page_view',
    featureUsed: 'feature_used',
    errorOccurred: 'error_occurred',
    performanceIssue: 'performance_issue',
  },
};

// Default user configuration (since no auth)
export const defaultUser = {
  id: 'default-user',
  email: 'seeker@sacred-shifter.app',
  username: 'sacred_seeker',
  display_name: 'Sacred Seeker',
  avatar_url: null,
  preferences: {
    theme: 'system',
    notifications: true,
    analytics: environment.isProduction,
    betaFeatures: environment.isDevelopment,
  },
};

// Export main config object
export default productionConfig;
