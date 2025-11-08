import { NextResponse } from 'next/server'
import { userService } from '@/services/user.service'
import {
  successResponse,
  paginatedResponse,
  createdResponse,
} from '@/lib/response'
import { handleError } from '@/lib/error'
import {
  createUserSchema,
  parseBody,
  parseQuery,
  userQuerySchema,
} from '@/lib/validation'

/**
 * GET /api/users
 * List all users with pagination, search, and filters
 * Query params: page, pageSize, q (search), role, isActive, organizationId
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = parseQuery(searchParams, userQuerySchema)
    
    // TODO: Get organizationId from auth context
    // For now, require it as query param
    const organizationId = searchParams.get('organizationId')
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId is required' },
        { status: 400 }
      )
    }

    const result = await userService.getUsers(
      organizationId,
      query.page,
      query.pageSize,
      {
        search: query.q,
        role: query.role,
        isActive: query.isActive,
      }
    )

    return paginatedResponse(result)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/users
 * Create a new user
 */
export async function POST(req: Request) {
  try {
    const body = await parseBody(req, createUserSchema)

    const user = await userService.createUser(body)

    return createdResponse(user)
  } catch (error) {
    return handleError(error)
  }
}
