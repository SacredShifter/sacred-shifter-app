// Enhanced error handling for production
import { APIError } from "encore.dev/api";
import { environment } from "./production-config";
import { logError } from "./middleware";

// Enhanced error types
export class ProductionError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;
  public readonly requestId?: string;

  constructor(
    message: string,
    code: string = "INTERNAL_ERROR",
    statusCode: number = 500,
    isOperational: boolean = true,
    requestId?: string
  ) {
    super(message);
    this.name = "ProductionError";
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date();
    this.requestId = requestId;

    // Capture stack trace
    Error.captureStackTrace(this, ProductionError);
  }

  toAPIError(): APIError {
    // Don't expose internal details in production
    const message = environment.isProduction && !this.isOperational
      ? "An internal error occurred"
      : this.message;

    switch (this.code) {
      case "VALIDATION_ERROR":
        return APIError.invalidArgument(message);
      case "NOT_FOUND":
        return APIError.notFound(message);
      case "ALREADY_EXISTS":
        return APIError.alreadyExists(message);
      case "PERMISSION_DENIED":
        return APIError.permissionDenied(message);
      case "RATE_LIMITED":
        return APIError.resourceExhausted(message);
      case "TIMEOUT":
        return APIError.deadlineExceeded(message);
      case "SERVICE_UNAVAILABLE":
        return APIError.unavailable(message);
      default:
        return APIError.internal(message);
    }
  }
}

// Error classification
export enum ErrorCategory {
  VALIDATION = "validation",
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  NOT_FOUND = "not_found",
  CONFLICT = "conflict",
  RATE_LIMIT = "rate_limit",
  EXTERNAL_SERVICE = "external_service",
  DATABASE = "database",
  NETWORK = "network",
  TIMEOUT = "timeout",
  INTERNAL = "internal",
}

// Error severity levels
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

// Enhanced error context
export interface ErrorContext {
  requestId?: string;
  userId?: string;
  module: string;
  operation: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  metadata?: Record<string, any>;
  userAgent?: string;
  ipAddress?: string;
}

// Production error handler
export class ProductionErrorHandler {
  private static instance: ProductionErrorHandler;

  static getInstance(): ProductionErrorHandler {
    if (!ProductionErrorHandler.instance) {
      ProductionErrorHandler.instance = new ProductionErrorHandler();
    }
    return ProductionErrorHandler.instance;
  }

  // Handle and classify errors
  handleError(error: Error, context: ErrorContext): never {
    const enhancedError = this.enhanceError(error, context);
    
    // Log the error
    this.logError(enhancedError, context);
    
    // Send to monitoring service in production
    if (environment.isProduction) {
      this.sendToMonitoring(enhancedError, context);
    }
    
    // Throw appropriate API error
    throw enhancedError.toAPIError();
  }

  private enhanceError(error: Error, context: ErrorContext): ProductionError {
    if (error instanceof ProductionError) {
      return error;
    }

    // Classify the error
    const { code, statusCode, isOperational } = this.classifyError(error, context);
    
    return new ProductionError(
      error.message,
      code,
      statusCode,
      isOperational,
      context.requestId
    );
  }

  private classifyError(error: Error, context: ErrorContext): {
    code: string;
    statusCode: number;
    isOperational: boolean;
  } {
    const message = error.message.toLowerCase();

    // Database errors
    if (this.isDatabaseError(error)) {
      if (message.includes("unique constraint")) {
        return { code: "ALREADY_EXISTS", statusCode: 409, isOperational: true };
      }
      if (message.includes("foreign key constraint")) {
        return { code: "VALIDATION_ERROR", statusCode: 400, isOperational: true };
      }
      if (message.includes("connection")) {
        return { code: "SERVICE_UNAVAILABLE", statusCode: 503, isOperational: true };
      }
      return { code: "DATABASE_ERROR", statusCode: 500, isOperational: false };
    }

    // Network/timeout errors
    if (this.isNetworkError(error)) {
      return { code: "TIMEOUT", statusCode: 504, isOperational: true };
    }

    // Validation errors
    if (this.isValidationError(error)) {
      return { code: "VALIDATION_ERROR", statusCode: 400, isOperational: true };
    }

    // External service errors
    if (context.category === ErrorCategory.EXTERNAL_SERVICE) {
      return { code: "EXTERNAL_SERVICE_ERROR", statusCode: 502, isOperational: true };
    }

    // Default to internal error
    return { code: "INTERNAL_ERROR", statusCode: 500, isOperational: false };
  }

  private isDatabaseError(error: Error): boolean {
    const dbErrorPatterns = [
      "connection",
      "constraint",
      "relation",
      "column",
      "syntax error",
      "permission denied",
    ];
    
    return dbErrorPatterns.some(pattern => 
      error.message.toLowerCase().includes(pattern)
    );
  }

  private isNetworkError(error: Error): boolean {
    const networkErrorPatterns = [
      "timeout",
      "network",
      "econnreset",
      "enotfound",
      "econnrefused",
    ];
    
    return networkErrorPatterns.some(pattern => 
      error.message.toLowerCase().includes(pattern)
    );
  }

  private isValidationError(error: Error): boolean {
    const validationErrorPatterns = [
      "validation",
      "invalid",
      "required",
      "must be",
      "expected",
    ];
    
    return validationErrorPatterns.some(pattern => 
      error.message.toLowerCase().includes(pattern)
    );
  }

  private logError(error: ProductionError, context: ErrorContext): void {
    const errorData = {
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        isOperational: error.isOperational,
        timestamp: error.timestamp,
        stack: error.stack,
      },
      context,
      environment: process.env.NODE_ENV,
    };

    // Use appropriate log level based on severity
    switch (context.severity) {
      case ErrorSeverity.CRITICAL:
        console.error("[CRITICAL ERROR]", JSON.stringify(errorData, null, 2));
        break;
      case ErrorSeverity.HIGH:
        console.error("[HIGH ERROR]", JSON.stringify(errorData, null, 2));
        break;
      case ErrorSeverity.MEDIUM:
        console.warn("[MEDIUM ERROR]", JSON.stringify(errorData, null, 2));
        break;
      case ErrorSeverity.LOW:
        console.info("[LOW ERROR]", JSON.stringify(errorData, null, 2));
        break;
    }
  }

  private sendToMonitoring(error: ProductionError, context: ErrorContext): void {
    // In production, this would send to external monitoring service
    // For now, we'll just log it
    console.log("[MONITORING]", {
      error: error.code,
      module: context.module,
      operation: context.operation,
      severity: context.severity,
      timestamp: error.timestamp,
    });
  }
}

// Convenience functions for common error scenarios
export function handleModuleError(
  module: string,
  operation: string,
  error: unknown,
  requestId?: string
): never {
  const errorHandler = ProductionErrorHandler.getInstance();
  
  const context: ErrorContext = {
    requestId,
    module,
    operation,
    category: ErrorCategory.INTERNAL,
    severity: ErrorSeverity.MEDIUM,
  };

  errorHandler.handleError(error as Error, context);
}

export function handleValidationError(
  module: string,
  operation: string,
  message: string,
  requestId?: string
): never {
  const errorHandler = ProductionErrorHandler.getInstance();
  
  const context: ErrorContext = {
    requestId,
    module,
    operation,
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
  };

  const error = new ProductionError(message, "VALIDATION_ERROR", 400, true, requestId);
  errorHandler.handleError(error, context);
}

export function handleDatabaseError(
  module: string,
  operation: string,
  error: unknown,
  requestId?: string
): never {
  const errorHandler = ProductionErrorHandler.getInstance();
  
  const context: ErrorContext = {
    requestId,
    module,
    operation,
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.HIGH,
  };

  errorHandler.handleError(error as Error, context);
}

export function handleExternalServiceError(
  module: string,
  operation: string,
  service: string,
  error: unknown,
  requestId?: string
): never {
  const errorHandler = ProductionErrorHandler.getInstance();
  
  const context: ErrorContext = {
    requestId,
    module,
    operation,
    category: ErrorCategory.EXTERNAL_SERVICE,
    severity: ErrorSeverity.MEDIUM,
    metadata: { service },
  };

  errorHandler.handleError(error as Error, context);
}

// Error recovery utilities
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  backoffMs: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff
      const delay = backoffMs * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Circuit breaker pattern for external services
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: "closed" | "open" | "half-open" = "closed";
  
  constructor(
    private readonly threshold: number = 5,
    private readonly timeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = "half-open";
      } else {
        throw new ProductionError(
          "Circuit breaker is open",
          "SERVICE_UNAVAILABLE",
          503
        );
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = "closed";
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = "open";
    }
  }
}
