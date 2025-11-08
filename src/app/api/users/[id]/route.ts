import { NextResponse } from 'next/server'
import { userService } from '@/services/user.service'
import {
  successResponse,
  notFoundResponse,
  noContentResponse,
} from '@/lib/response'
import { handleError } from '@/lib/error'
import { updateUserSchema, parseBody, idSchema } from '@/lib/validation'

/**
 * GET /api/users/:id
 * Get a single user by ID
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    idSchema.parse(id)

    const { searchParams } = new URL(req.url)
    const organizationId = searchParams.get('organizationId')
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId is required' },
        { status: 400 }
      )
    }

    const user = await userService.getUserById(id, organizationId)

    if (!user) {
      return notFoundResponse('User')
    }

    return successResponse(user)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PUT /api/users/:id
 * Update a user
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    idSchema.parse(id)

    const { searchParams } = new URL(req.url)
    const organizationId = searchParams.get('organizationId')
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId is required' },
        { status: 400 }
      )
    }

    const body = await parseBody(req, updateUserSchema)

    const user = await userService.updateUser(id, organizationId, body)

    if (!user) {
      return notFoundResponse('User')
    }

    return successResponse(user)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/users/:id
 * Soft delete a user
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    idSchema.parse(id)

    const { searchParams } = new URL(req.url)
    const organizationId = searchParams.get('organizationId')
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId is required' },
        { status: 400 }
      )
    }

    const success = await userService.deleteUser(id, organizationId)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete user' },
        { status: 500 }
      )
    }

    return noContentResponse()
  } catch (error) {
    return handleError(error)
  }
}
