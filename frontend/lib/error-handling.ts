// Production error handling for frontend
import { productionConfig, environment, errorMessages } from '../config/production';

// Error types
export enum ErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  RATE_LIMIT = 'rate_limit',
  SERVER = 'server',
  CLIENT = 'client',
  UNKNOWN = 'unknown',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Enhanced error class
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly code?: string;
  public readonly statusCode?: number;
  public readonly timestamp: Date;
  public readonly userMessage: string;
  public readonly metadata?: Record<string, any>;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    userMessage?: string,
    code?: string,
    statusCode?: number,
    metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.code = code;
    this.statusCode = statusCode;
    this.timestamp = new Date();
    this.userMessage = userMessage || this.getDefaultUserMessage();
    this.metadata = metadata;

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  private getDefaultUserMessage(): string {
    switch (this.type) {
      case ErrorType.NETWORK:
        if (this.statusCode === 408 || this.message.includes('timeout')) {
          return errorMessages.network.timeout;
        }
        if (this.statusCode === 429) {
          return errorMessages.network.rateLimited;
        }
        if (this.statusCode && this.statusCode >= 500) {
          return errorMessages.network.serverError;
        }
        return errorMessages.network.offline;

      case ErrorType.VALIDATION:
        return errorMessages.validation.invalid;

      case ErrorType.AUTHENTICATION:
        return errorMessages.auth.unauthorized;

      case ErrorType.AUTHORIZATION:
        return errorMessages.auth.forbidden;

      case ErrorType.RATE_LIMIT:
        return errorMessages.network.rateLimited;

      default:
        return errorMessages.generic.unknown;
    }
  }

  // Convert to user-friendly format
  toUserError(): {
    message: string;
    type: string;
    canRetry: boolean;
    retryAfter?: number;
  } {
    return {
      message: this.userMessage,
      type: this.type,
      canRetry: this.isRetryable(),
      retryAfter: this.getRetryAfter(),
    };
  }

  private isRetryable(): boolean {
    // Network errors are usually retryable
    if (this.type === ErrorType.NETWORK) {
      // Don't retry client errors (4xx except 408, 429)
      if (this.statusCode && this.statusCode >= 400 && this.statusCode < 500) {
        return this.statusCode === 408 || this.statusCode === 429;
      }
      return true;
    }

    // Server errors are retryable
    if (this.type === ErrorType.SERVER) {
      return true;
    }

    // Other errors are generally not retryable
    return false;
  }

  private getRetryAfter(): number | undefined {
    if (this.type === ErrorType.RATE_LIMIT) {
      return this.metadata?.retryAfter || 60; // Default 60 seconds
    }
    
    if (this.type === ErrorType.NETWORK && this.statusCode === 429) {
      return this.metadata?.retryAfter || 60;
    }

    return undefined;
  }
}

// Error handler class
export class ErrorHandler {
  private static instance: ErrorHandler;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Handle and classify errors
  handleError(error: unknown, context?: Record<string, any>): AppError {
    const appError = this.classifyError(error, context);
    
    // Log the error
    this.logError(appError, context);
    
    // Send to monitoring service in production
    if (environment.isProduction && productionConfig.features.enableErrorTracking) {
      this.sendToMonitoring(appError, context);
    }
    
    return appError;
  }

  private classifyError(error: unknown, context?: Record<string, any>): AppError {
    // Already an AppError
    if (error instanceof AppError) {
      return error;
    }

    // Network/fetch errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return new AppError(
        error.message,
        ErrorType.NETWORK,
        ErrorSeverity.MEDIUM,
        errorMessages.network.offline,
        'NETWORK_ERROR'
      );
    }

    // HTTP response errors
    if (this.isHttpError(error)) {
      return this.handleHttpError(error as any);
    }

    // Validation errors
    if (this.isValidationError(error)) {
      return new AppError(
        (error as Error).message,
        ErrorType.VALIDATION,
        ErrorSeverity.LOW,
        errorMessages.validation.invalid,
        'VALIDATION_ERROR'
      );
    }

    // Generic JavaScript errors
    if (error instanceof Error) {
      return new AppError(
        error.message,
        ErrorType.CLIENT,
        ErrorSeverity.MEDIUM,
        errorMessages.generic.unknown,
        'CLIENT_ERROR',
        undefined,
        { stack: error.stack, context }
      );
    }

    // Unknown error types
    return new AppError(
      String(error),
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM,
      errorMessages.generic.unknown,
      'UNKNOWN_ERROR',
      undefined,
      { originalError: error, context }
    );
  }

  private isHttpError(error: any): boolean {
    return error && typeof error.status === 'number' && error.status >= 400;
  }

  private handleHttpError(error: { status: number; statusText?: string; data?: any }): AppError {
    const { status, statusText, data } = error;
    
    let type: ErrorType;
    let severity: ErrorSeverity;
    let userMessage: string;

    if (status === 401) {
      type = ErrorType.AUTHENTICATION;
      severity = ErrorSeverity.MEDIUM;
      userMessage = errorMessages.auth.unauthorized;
    } else if (status === 403) {
      type = ErrorType.AUTHORIZATION;
      severity = ErrorSeverity.MEDIUM;
      userMessage = errorMessages.auth.forbidden;
    } else if (status === 429) {
      type = ErrorType.RATE_LIMIT;
      severity = ErrorSeverity.LOW;
      userMessage = errorMessages.network.rateLimited;
    } else if (status >= 400 && status < 500) {
      type = ErrorType.CLIENT;
      severity = ErrorSeverity.LOW;
      userMessage = data?.message || errorMessages.validation.invalid;
    } else if (status >= 500) {
      type = ErrorType.SERVER;
      severity = ErrorSeverity.HIGH;
      userMessage = errorMessages.network.serverError;
    } else {
      type = ErrorType.NETWORK;
      severity = ErrorSeverity.MEDIUM;
      userMessage = errorMessages.network.offline;
    }

    return new AppError(
      `HTTP ${status}: ${statusText || 'Unknown error'}`,
      type,
      severity,
      userMessage,
      `HTTP_${status}`,
      status,
      { responseData: data }
    );
  }

  private isValidationError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    
    const validationKeywords = [
      'validation',
      'invalid',
      'required',
      'must be',
      'expected',
      'format',
    ];
    
    return validationKeywords.some(keyword => 
      error.message.toLowerCase().includes(keyword)
    );
  }

  private logError(error: AppError, context?: Record<string, any>): void {
    const logData = {
      error: {
        name: error.name,
        message: error.message,
        type: error.type,
        severity: error.severity,
        code: error.code,
        statusCode: error.statusCode,
        timestamp: error.timestamp,
        stack: error.stack,
      },
      context,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };

    // Use appropriate log level based on severity
    if (productionConfig.monitoring.enableConsoleLogging) {
      switch (error.severity) {
        case ErrorSeverity.CRITICAL:
          console.error('[CRITICAL ERROR]', logData);
          break;
        case ErrorSeverity.HIGH:
          console.error('[HIGH ERROR]', logData);
          break;
        case ErrorSeverity.MEDIUM:
          console.warn('[MEDIUM ERROR]', logData);
          break;
        case ErrorSeverity.LOW:
          console.info('[LOW ERROR]', logData);
          break;
      }
    }
  }

  private sendToMonitoring(error: AppError, context?: Record<string, any>): void {
    // In production, this would send to external monitoring service (Sentry, LogRocket, etc.)
    if (environment.isProduction) {
      // Example: Sentry.captureException(error, { contexts: { custom: context } });
      console.log('[MONITORING]', {
        error: error.code,
        type: error.type,
        severity: error.severity,
        timestamp: error.timestamp,
        url: window.location.href,
      });
    }
  }
}

// Retry mechanism for failed operations
export class RetryHandler {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    backoffMultiplier: number = 2
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain error types
        if (error instanceof AppError && !error.toUserError().canRetry) {
          throw error;
        }
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(backoffMultiplier, attempt - 1);
        const jitter = Math.random() * 0.1 * delay; // 10% jitter
        await new Promise(resolve => setTimeout(resolve, delay + jitter));
      }
    }
    
    throw lastError!;
  }
}

// Global error boundary handler
export function setupGlobalErrorHandling(): void {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const errorHandler = ErrorHandler.getInstance();
    const appError = errorHandler.handleError(event.reason, {
      type: 'unhandled_promise_rejection',
      url: window.location.href,
    });
    
    // Prevent the default browser error handling
    event.preventDefault();
    
    // Show user-friendly error message
    console.error('Unhandled promise rejection:', appError.toUserError());
  });

  // Handle uncaught JavaScript errors
  window.addEventListener('error', (event) => {
    const errorHandler = ErrorHandler.getInstance();
    const appError = errorHandler.handleError(event.error, {
      type: 'uncaught_error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      url: window.location.href,
    });
    
    console.error('Uncaught error:', appError.toUserError());
  });

  // Handle resource loading errors
  window.addEventListener('error', (event) => {
    if (event.target !== window) {
      const errorHandler = ErrorHandler.getInstance();
      const appError = errorHandler.handleError(
        new Error(`Failed to load resource: ${(event.target as any)?.src || 'unknown'}`),
        {
          type: 'resource_load_error',
          element: event.target,
          url: window.location.href,
        }
      );
      
      console.warn('Resource load error:', appError.toUserError());
    }
  }, true);
}

// Convenience functions
export function handleApiError(error: unknown, context?: Record<string, any>): AppError {
  const errorHandler = ErrorHandler.getInstance();
  return errorHandler.handleError(error, context);
}

export function createValidationError(message: string, field?: string): AppError {
  return new AppError(
    message,
    ErrorType.VALIDATION,
    ErrorSeverity.LOW,
    message,
    'VALIDATION_ERROR',
    400,
    { field }
  );
}

export function createNetworkError(message: string, statusCode?: number): AppError {
  return new AppError(
    message,
    ErrorType.NETWORK,
    ErrorSeverity.MEDIUM,
    undefined,
    'NETWORK_ERROR',
    statusCode
  );
}
