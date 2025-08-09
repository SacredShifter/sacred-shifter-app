// Shared types across all services
export interface BaseEntity {
  id: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserContext {
  user_id: string;
  username: string;
  email?: string;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  has_more: boolean;
}

export interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
}
