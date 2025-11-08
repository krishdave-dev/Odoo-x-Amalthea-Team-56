import { Prisma } from '@prisma/client'
import { errorResponse, conflictResponse, notFoundResponse } from './response'
import { NextResponse } from 'next/server'

/**
 * Custom application errors
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT')
    this.name = 'ConflictError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
    this.name = 'ForbiddenError'
  }
}

/**
 * Handle Prisma errors
 */
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): NextResponse {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const target = (error.meta?.target as string[]) || []
      return conflictResponse(
        `A record with this ${target.join(', ')} already exists`
      )
    
    case 'P2025':
      // Record not found
      return notFoundResponse('Resource')
    
    case 'P2003':
      // Foreign key constraint violation
      return errorResponse('Referenced record does not exist', 400)
    
    case 'P2014':
      // Invalid ID
      return errorResponse('Invalid ID provided', 400)
    
    case 'P2023':
      // Inconsistent column data
      return errorResponse('Invalid data format', 400)
    
    default:
      console.error('Unhandled Prisma error:', error)
      return errorResponse('Database error occurred', 500)
  }
}

/**
 * Global error handler for API routes
 */
export function handleError(error: unknown): NextResponse {
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', error)
  }

  // Handle custom app errors
  if (error instanceof AppError) {
    return errorResponse(error.message, error.statusCode)
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error)
  }

  // Handle Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return errorResponse('Invalid data provided', 400)
  }

  // Handle generic errors
  if (error instanceof Error) {
    // Don't expose internal error messages in production
    const message = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'An unexpected error occurred'
    return errorResponse(message, 500)
  }

  // Unknown error type
  return errorResponse('An unexpected error occurred', 500)
}

/**
 * Async error wrapper for route handlers
 */
export function withErrorHandler(
  handler: (req: Request, context?: any) => Promise<NextResponse>
) {
  return async (req: Request, context?: any): Promise<NextResponse> => {
    try {
      return await handler(req, context)
    } catch (error) {
      return handleError(error)
    }
  }
}
