/**
 * Type definitions for Settings API
 */

// Core Settings type - allows any JSON structure
export interface SettingsData {
  [key: string]: any;
}

// Settings object as stored in database
export interface Settings {
  uid: string;
  data: SettingsData;
  created_at: Date;
  updated_at: Date;
}

// Settings object as returned to API consumers
export interface SettingsResponse {
  uid: string;
  data: SettingsData;
  _metadata: {
    created_at: Date;
    updated_at: Date;
  };
}

// Pagination parameters
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

// Pagination metadata in response
export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Paginated response
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

// API Error response
export interface ApiError {
  error: string;
  message: string;
}

// Database configuration
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

// Environment variables
export interface Environment {
  DB_HOST: string;
  DB_PORT: string;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  PORT: string;
  NODE_ENV: string;
}
