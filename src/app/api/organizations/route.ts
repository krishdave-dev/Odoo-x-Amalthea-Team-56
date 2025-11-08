import { NextRequest, NextResponse } from 'next/server'
import { organizationService } from '@/services/organization.service'
import {
  successResponse,
  paginatedResponse,
  errorResponse,
  createdResponse,
} from '@/lib/response'
import { handleError } from '@/lib/error'
import {
  createOrganizationSchema,
  parseBody,
  parseQuery,
  paginationSchema,
} from '@/lib/validation'
import { z } from 'zod'
import { withAuth } from '@/lib/middleware/auth'

// Query schema for GET requests
const organizationQuerySchema = paginationSchema.extend({
  q: z.string().optional(),
  includeProjects: z.coerce.boolean().optional(),
})

/**
 * GET /api/organizations
 * List all organizations with pagination and search
 * 
 * Public endpoint: Unauthenticated users can view organizations during signup
 * Authenticated users (admin) can see additional details
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const { page, pageSize, q, includeProjects } = parseQuery(
      searchParams,
      organizationQuerySchema
    )

    // Try to get authenticated user, but don't require it
    const { user } = await withAuth(req, { requireAuth: false })

    // If user is authenticated and is an admin, show all details
    // Otherwise, show only basic info for signup
    const result = await organizationService.getOrganizations(
      page,
      pageSize,
      q,
      user?.role === 'admin' ? includeProjects : false // Only admins can include projects
    )

    return paginatedResponse(result)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/organizations
 * Create a new organization
 * 
 * Permissions: Users with canCreateOrganization permission (admin creating new org during signup)
 */
export async function POST(req: NextRequest) {
  try {
    const { user, error } = await withAuth(req, {
      requirePermissions: ['canCreateOrganization'],
    })
    if (error) return error

    const body = await parseBody(req, createOrganizationSchema)

    const organization = await organizationService.createOrganization(body)

    return createdResponse(organization)
  } catch (error) {
    return handleError(error)
  }
}

