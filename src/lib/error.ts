import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

/**
 * Centralized error handling for API routes
 */

export interface ErrorResponse {
  success: false
  error: {
    message: string
    code: string
    details?: unknown
  }
}

/**
 * Handle errors and return appropriate HTTP response
 */
export function handleError(error: unknown): NextResponse<ErrorResponse> {
  console.error('API Error:', error)

  // Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        error: {
          message: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: error.issues,
        },
      },
      { status: 400 }
    )
  }

  // Prisma known request errors
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const prismaError = error as { code: string; meta?: unknown }
    
    // Unique constraint violation
    if (prismaError.code === 'P2002') {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: {
            message: 'A record with this value already exists',
            code: 'DUPLICATE_ENTRY',
            details: prismaError.meta,
          },
        },
        { status: 409 }
      )
    }

    // Record not found
    if (prismaError.code === 'P2025') {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: {
            message: 'Record not found',
            code: 'NOT_FOUND',
          },
        },
        { status: 404 }
      )
    }

    // Foreign key constraint violation
    if (prismaError.code === 'P2003') {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: {
            message: 'Related record not found',
            code: 'FOREIGN_KEY_VIOLATION',
            details: prismaError.meta,
          },
        },
        { status: 400 }
      )
    }
  }

  // Prisma validation errors (check for message pattern)
  if (error instanceof Error && error.message.includes('Prisma')) {
    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        error: {
          message: 'Invalid data provided',
          code: 'VALIDATION_ERROR',
        },
      },
      { status: 400 }
    )
  }

  // Custom application errors
  if (error instanceof Error) {
    // Check for specific error messages
    if (error.message.includes('not found')) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: {
            message: error.message,
            code: 'NOT_FOUND',
          },
        },
        { status: 404 }
      )
    }

    if (error.message.includes('not allowed') || error.message.includes('forbidden')) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: {
            message: error.message,
            code: 'FORBIDDEN',
          },
        },
        { status: 403 }
      )
    }

    // Generic error
    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        error: {
          message: error.message,
          code: 'INTERNAL_ERROR',
        },
      },
      { status: 500 }
    )
  }

  // Unknown error
  return NextResponse.json<ErrorResponse>(
    {
      success: false,
      error: {
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
      },
    },
    { status: 500 }
  )
}

/**
 * Create a validation error response
 */
export function validationError(message: string, details?: unknown): NextResponse<ErrorResponse> {
  return NextResponse.json<ErrorResponse>(
    {
      success: false,
      error: {
        message,
        code: 'VALIDATION_ERROR',
        details,
      },
    },
    { status: 400 }
  )
}

/**
 * Create a not found error response
 */
export function notFoundError(message: string = 'Resource not found'): NextResponse<ErrorResponse> {
  return NextResponse.json<ErrorResponse>(
    {
      success: false,
      error: {
        message,
        code: 'NOT_FOUND',
      },
    },
    { status: 404 }
  )
}

/**
 * Create a forbidden error response
 */
export function forbiddenError(message: string = 'Action not allowed'): NextResponse<ErrorResponse> {
  return NextResponse.json<ErrorResponse>(
    {
      success: false,
      error: {
        message,
        code: 'FORBIDDEN',
      },
    },
    { status: 403 }
  )
}
