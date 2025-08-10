// Production-ready input validation and sanitization
import { APIError } from "encore.dev/api";
import { handleValidationError } from "./error-handling";

// Validation rules
export interface ValidationRule {
  required?: boolean;
  type?: "string" | "number" | "boolean" | "array" | "object" | "date" | "email" | "url";
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: string[];
  custom?: (value: any) => boolean | string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

// Validation result
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: any;
}

// Production validator class
export class ProductionValidator {
  private static instance: ProductionValidator;

  static getInstance(): ProductionValidator {
    if (!ProductionValidator.instance) {
      ProductionValidator.instance = new ProductionValidator();
    }
    return ProductionValidator.instance;
  }

  // Validate data against schema
  validate(data: any, schema: ValidationSchema, module: string = "unknown"): any {
    const result = this.validateData(data, schema);
    
    if (!result.isValid) {
      handleValidationError(
        module,
        "validation",
        `Validation failed: ${result.errors.join(", ")}`
      );
    }
    
    return result.sanitizedData;
  }

  private validateData(data: any, schema: ValidationSchema): ValidationResult {
    const errors: string[] = [];
    const sanitizedData: any = {};

    // Check for required fields
    for (const [field, rule] of Object.entries(schema)) {
      if (rule.required && (data[field] === undefined || data[field] === null)) {
        errors.push(`Field '${field}' is required`);
        continue;
      }

      if (data[field] !== undefined && data[field] !== null) {
        const fieldResult = this.validateField(field, data[field], rule);
        if (fieldResult.errors.length > 0) {
          errors.push(...fieldResult.errors);
        } else {
          sanitizedData[field] = fieldResult.value;
        }
      }
    }

    // Check for unexpected fields
    for (const field of Object.keys(data)) {
      if (!schema[field]) {
        errors.push(`Unexpected field '${field}'`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: errors.length === 0 ? sanitizedData : undefined,
    };
  }

  private validateField(field: string, value: any, rule: ValidationRule): {
    errors: string[];
    value: any;
  } {
    const errors: string[] = [];
    let sanitizedValue = value;

    // Type validation
    if (rule.type) {
      const typeResult = this.validateType(field, value, rule.type);
      if (typeResult.errors.length > 0) {
        errors.push(...typeResult.errors);
        return { errors, value: sanitizedValue };
      }
      sanitizedValue = typeResult.value;
    }

    // String validations
    if (rule.type === "string" && typeof sanitizedValue === "string") {
      if (rule.minLength && sanitizedValue.length < rule.minLength) {
        errors.push(`Field '${field}' must be at least ${rule.minLength} characters`);
      }
      if (rule.maxLength && sanitizedValue.length > rule.maxLength) {
        errors.push(`Field '${field}' must be at most ${rule.maxLength} characters`);
      }
      if (rule.pattern && !rule.pattern.test(sanitizedValue)) {
        errors.push(`Field '${field}' format is invalid`);
      }
      if (rule.enum && !rule.enum.includes(sanitizedValue)) {
        errors.push(`Field '${field}' must be one of: ${rule.enum.join(", ")}`);
      }
    }

    // Number validations
    if (rule.type === "number" && typeof sanitizedValue === "number") {
      if (rule.min !== undefined && sanitizedValue < rule.min) {
        errors.push(`Field '${field}' must be at least ${rule.min}`);
      }
      if (rule.max !== undefined && sanitizedValue > rule.max) {
        errors.push(`Field '${field}' must be at most ${rule.max}`);
      }
    }

    // Array validations
    if (rule.type === "array" && Array.isArray(sanitizedValue)) {
      if (rule.minLength && sanitizedValue.length < rule.minLength) {
        errors.push(`Field '${field}' must have at least ${rule.minLength} items`);
      }
      if (rule.maxLength && sanitizedValue.length > rule.maxLength) {
        errors.push(`Field '${field}' must have at most ${rule.maxLength} items`);
      }
    }

    // Custom validation
    if (rule.custom) {
      const customResult = rule.custom(sanitizedValue);
      if (typeof customResult === "string") {
        errors.push(`Field '${field}': ${customResult}`);
      } else if (!customResult) {
        errors.push(`Field '${field}' failed custom validation`);
      }
    }

    return { errors, value: sanitizedValue };
  }

  private validateType(field: string, value: any, expectedType: string): {
    errors: string[];
    value: any;
  } {
    const errors: string[] = [];
    let sanitizedValue = value;

    switch (expectedType) {
      case "string":
        if (typeof value !== "string") {
          errors.push(`Field '${field}' must be a string`);
        } else {
          sanitizedValue = this.sanitizeString(value);
        }
        break;

      case "number":
        if (typeof value === "string" && !isNaN(Number(value))) {
          sanitizedValue = Number(value);
        } else if (typeof value !== "number" || isNaN(value)) {
          errors.push(`Field '${field}' must be a number`);
        }
        break;

      case "boolean":
        if (typeof value === "string") {
          if (value.toLowerCase() === "true") {
            sanitizedValue = true;
          } else if (value.toLowerCase() === "false") {
            sanitizedValue = false;
          } else {
            errors.push(`Field '${field}' must be a boolean`);
          }
        } else if (typeof value !== "boolean") {
          errors.push(`Field '${field}' must be a boolean`);
        }
        break;

      case "array":
        if (!Array.isArray(value)) {
          errors.push(`Field '${field}' must be an array`);
        }
        break;

      case "object":
        if (typeof value !== "object" || value === null || Array.isArray(value)) {
          errors.push(`Field '${field}' must be an object`);
        }
        break;

      case "date":
        if (value instanceof Date) {
          if (isNaN(value.getTime())) {
            errors.push(`Field '${field}' must be a valid date`);
          }
        } else if (typeof value === "string") {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            errors.push(`Field '${field}' must be a valid date`);
          } else {
            sanitizedValue = date;
          }
        } else {
          errors.push(`Field '${field}' must be a date`);
        }
        break;

      case "email":
        if (typeof value !== "string") {
          errors.push(`Field '${field}' must be a string`);
        } else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors.push(`Field '${field}' must be a valid email address`);
          } else {
            sanitizedValue = value.toLowerCase().trim();
          }
        }
        break;

      case "url":
        if (typeof value !== "string") {
          errors.push(`Field '${field}' must be a string`);
        } else {
          try {
            new URL(value);
            sanitizedValue = value.trim();
          } catch {
            errors.push(`Field '${field}' must be a valid URL`);
          }
        }
        break;

      default:
        errors.push(`Unknown type '${expectedType}' for field '${field}'`);
    }

    return { errors, value: sanitizedValue };
  }

  private sanitizeString(value: string): string {
    return value
      .trim()
      .replace(/[\x00-\x1F\x7F]/g, "") // Remove control characters
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
      .replace(/javascript:/gi, "") // Remove javascript: URLs
      .replace(/on\w+\s*=/gi, ""); // Remove event handlers
  }
}

// Common validation schemas
export const CommonSchemas = {
  // User input schemas
  createJournalEntry: {
    title: { required: true, type: "string", minLength: 1, maxLength: 200 },
    content: { required: true, type: "string", minLength: 1, maxLength: 10000 },
    tags: { type: "array", maxLength: 10 },
    mood: { type: "number", min: 1, max: 10 },
    weather: { type: "string", maxLength: 50 },
    location: { type: "string", maxLength: 100 },
  },

  createCodexEntry: {
    mode: { required: true, type: "string", enum: ["codex", "register"] },
    title: { type: "string", maxLength: 200 },
    content: { required: true, type: "object" },
    entry_type: { type: "string", maxLength: 50 },
    tags: { type: "array", maxLength: 20 },
    resonance_rating: { type: "number", min: 0, max: 1 },
    resonance_signature: { type: "string", maxLength: 100 },
    resonance_channels: { type: "array", maxLength: 10 },
    visibility: { type: "string", enum: ["private", "shared", "public"] },
  },

  startMeditationSession: {
    soundscape: { required: true, type: "string", maxLength: 50 },
    mood_before: { type: "number", min: 1, max: 10 },
    notes: { type: "string", maxLength: 500 },
  },

  createSharedLearning: {
    title: { required: true, type: "string", minLength: 1, maxLength: 200 },
    content: { required: true, type: "string", minLength: 1, maxLength: 5000 },
  },

  aiChat: {
    message: { required: true, type: "string", minLength: 1, maxLength: 2000 },
    conversation_id: { type: "string", maxLength: 50 },
    context_type: { type: "string", maxLength: 50 },
    context_data: { type: "object" },
  },

  // Pagination schemas
  pagination: {
    limit: { type: "number", min: 1, max: 1000 },
    offset: { type: "number", min: 0 },
  },

  // Search schemas
  search: {
    search: { type: "string", maxLength: 200 },
    tags: { type: "array", maxLength: 10 },
    date_from: { type: "date" },
    date_to: { type: "date" },
  },
};

// Convenience validation functions
export function validateJournalEntry(data: any, module: string = "journal"): any {
  const validator = ProductionValidator.getInstance();
  return validator.validate(data, CommonSchemas.createJournalEntry, module);
}

export function validateCodexEntry(data: any, module: string = "codex"): any {
  const validator = ProductionValidator.getInstance();
  return validator.validate(data, CommonSchemas.createCodexEntry, module);
}

export function validateMeditationSession(data: any, module: string = "meditation"): any {
  const validator = ProductionValidator.getInstance();
  return validator.validate(data, CommonSchemas.startMeditationSession, module);
}

export function validatePagination(data: any, module: string = "unknown"): any {
  const validator = ProductionValidator.getInstance();
  return validator.validate(data, CommonSchemas.pagination, module);
}

export function validateSearch(data: any, module: string = "unknown"): any {
  const validator = ProductionValidator.getInstance();
  return validator.validate(data, CommonSchemas.search, module);
}

// ID validation utilities
export function validateId(id: string, fieldName: string = "id"): string {
  if (!id || typeof id !== "string") {
    throw APIError.invalidArgument(`${fieldName} is required and must be a string`);
  }

  // Basic UUID format check (loose)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw APIError.invalidArgument(`${fieldName} must be a valid UUID`);
  }

  return id;
}

// SQL injection prevention
export function sanitizeForSQL(value: string): string {
  return value.replace(/['";\\]/g, "");
}

// XSS prevention
export function sanitizeForHTML(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}
