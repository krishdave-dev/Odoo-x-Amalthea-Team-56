import { NextResponse } from 'next/server'
import { organizationService } from '@/services/organization.service'
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  noContentResponse,
} from '@/lib/response'
import { handleError } from '@/lib/error'
import { updateOrganizationSchema, parseBody, idSchema } from '@/lib/validation'
import { z } from 'zod'

/**
 * GET /api/organizations/:id
 * Get a single organization by ID
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    idSchema.parse(id)

    const { searchParams } = new URL(req.url)
    const includeProjects = searchParams.get('includeProjects') === 'true'

    const organization = await organizationService.getOrganizationById(
      id,
      includeProjects
    )

    if (!organization) {
      return notFoundResponse('Organization')
    }

    return successResponse(organization)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PUT /api/organizations/:id
 * Update an organization
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    idSchema.parse(id)

    const body = await parseBody(req, updateOrganizationSchema)

    const organization = await organizationService.updateOrganization(id, body)

    if (!organization) {
      return notFoundResponse('Organization')
    }

    return successResponse(organization)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/organizations/:id
 * Delete an organization (use with caution - cascades to all related data)
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    idSchema.parse(id)

    const success = await organizationService.deleteOrganization(id)

    if (!success) {
      return errorResponse('Failed to delete organization', 500)
    }

    return noContentResponse()
  } catch (error) {
    return handleError(error)
  }
}
