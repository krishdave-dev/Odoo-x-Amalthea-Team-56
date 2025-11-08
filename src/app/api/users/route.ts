import { NextRequest, NextResponse } from 'next/server'
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
import { withAuth, getOrganizationId } from '@/lib/middleware/auth'

/**
 * GET /api/users
 * List all users with pagination, search, and filters
 * Query params: page, pageSize, q (search), role, isActive
 * 
 * Permissions: Admin only
 */
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await withAuth(req, { requireRoles: ['admin'] })
    if (error) return error

    const { searchParams } = new URL(req.url)
    const query = parseQuery(searchParams, userQuerySchema)
    
    const organizationId = getOrganizationId(user!).toString()

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
 * 
 * Permissions: Admin only
 */
export async function POST(req: NextRequest) {
  try {
    const { user, error } = await withAuth(req, { requireRoles: ['admin'] })
    if (error) return error

    const body = await parseBody(req, createUserSchema)

    // Ensure user is created in same organization
    const userToCreate = {
      ...body,
      organizationId: getOrganizationId(user!).toString(),
    }

    const newUser = await userService.createUser(userToCreate)

    return createdResponse(newUser)
  } catch (error) {
    return handleError(error)
  }
}

