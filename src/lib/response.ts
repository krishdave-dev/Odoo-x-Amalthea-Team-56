import { NextResponse } from 'next/server'
import type { ApiResponse, PaginatedResponse } from '@/types/common'

/**
 * Success response helper
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
  }
  return NextResponse.json(response, { status })
}

/**
 * Paginated success response helper
 */
export function paginatedResponse<T>(
  result: PaginatedResponse<T>,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data: result.data,
      meta: result.pagination,
    },
    { status }
  )
}

/**
 * Error response helper
 */
export function errorResponse(
  message: string,
  status: number = 400,
  error?: any
): NextResponse {
  const response: ApiResponse = {
    success: false,
    error: message,
  }

  // Log error details in development
  if (process.env.NODE_ENV === 'development' && error) {
    console.error('API Error:', error)
  }

  return NextResponse.json(response, { status })
}

/**
 * Validation error response
 */
export function validationErrorResponse(errors: any): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'Validation failed',
      details: errors,
    },
    { status: 400 }
  )
}

/**
 * Not found response
 */
export function notFoundResponse(resource: string): NextResponse {
  return errorResponse(`${resource} not found`, 404)
}

/**
 * Unauthorized response
 */
export function unauthorizedResponse(message: string = 'Unauthorized'): NextResponse {
  return errorResponse(message, 401)
}

/**
 * Forbidden response
 */
export function forbiddenResponse(message: string = 'Forbidden'): NextResponse {
  return errorResponse(message, 403)
}

/**
 * Conflict response (for duplicate entries)
 */
export function conflictResponse(message: string): NextResponse {
  return errorResponse(message, 409)
}

/**
 * Created response
 */
export function createdResponse<T>(data: T): NextResponse {
  return successResponse(data, 201)
}

/**
 * No content response (for successful deletes)
 */
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 })
}
