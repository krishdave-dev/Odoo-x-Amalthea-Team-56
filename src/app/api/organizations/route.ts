import { NextResponse } from 'next/server'
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

// Query schema for GET requests
const organizationQuerySchema = paginationSchema.extend({
  q: z.string().optional(),
  includeProjects: z.coerce.boolean().optional(),
})

/**
 * GET /api/organizations
 * List all organizations with pagination and search
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const { page, pageSize, q, includeProjects } = parseQuery(
      searchParams,
      organizationQuerySchema
    )

    const result = await organizationService.getOrganizations(
      page,
      pageSize,
      q,
      includeProjects
    )

    return paginatedResponse(result)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/organizations
 * Create a new organization
 */
export async function POST(req: Request) {
  try {
    const body = await parseBody(req, createOrganizationSchema)

    const organization = await organizationService.createOrganization(body)

    return createdResponse(organization)
  } catch (error) {
    return handleError(error)
  }
}

