/**
 * Type utilities for better type safety
 */

export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E }

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>

/**
 * Common response types for API routes
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Pagination types
 */
export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

/**
 * Filter and sort types
 */
export interface SortParams {
  field: string
  order: 'asc' | 'desc'
}

export interface FilterParams {
  [key: string]: any
}
