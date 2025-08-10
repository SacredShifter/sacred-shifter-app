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

// Production Error Handler with Monitoring
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

  // Placeholder method for monitoring service
  private sendToMonitoring(error: ProductionError, context: ErrorContext): void {
    // Integration with a monitoring service like DataDog or Sentry
    // Example: Sentry.captureException(error);
  }

  // Log error method
  private logError(error: ProductionError, context: ErrorContext): void {
    logError(error.message, {
      requestId: context.requestId,
      statusCode: error.statusCode,
      code: error.code,
      timestamp: error.timestamp,
    });
  }
}