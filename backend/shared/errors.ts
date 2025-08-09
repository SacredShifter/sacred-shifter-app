import { APIError } from "encore.dev/api";

export class ModuleError extends Error {
  constructor(
    public module: string,
    public operation: string,
    message: string,
    public originalError?: Error
  ) {
    super(`[${module}:${operation}] ${message}`);
    this.name = 'ModuleError';
  }

  toAPIError(): APIError {
    if (this.message.includes('not found')) {
      return APIError.notFound(this.message);
    }
    if (this.message.includes('already exists')) {
      return APIError.alreadyExists(this.message);
    }
    if (this.message.includes('permission')) {
      return APIError.permissionDenied(this.message);
    }
    return APIError.internal(this.message);
  }
}

export function handleModuleError(module: string, operation: string, error: unknown): never {
  if (error instanceof ModuleError) {
    throw error.toAPIError();
  }
  
  const moduleError = new ModuleError(
    module,
    operation,
    error instanceof Error ? error.message : 'Unknown error',
    error instanceof Error ? error : undefined
  );
  
  throw moduleError.toAPIError();
}
