import { NextRequest, NextResponse } from 'next/server'
import { timesheetService } from '@/services/timesheet.service'
import { updateTimesheetSchema } from '@/validations/timesheetSchema'
import { handleError, validationError, notFoundError } from '@/lib/error'
import type { ApiResponse } from '@/types/common'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/v1/timesheets/[id]
 * Get a single timesheet by ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params

    const timesheet = await timesheetService.getTimesheetById(id)

    if (!timesheet) {
      return notFoundError('Timesheet not found')
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: timesheet,
    })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PUT /api/v1/timesheets/[id]
 * Update a timesheet entry
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Validate input
    const validation = updateTimesheetSchema.safeParse(body)
    if (!validation.success) {
      return validationError('Invalid timesheet data', validation.error.issues)
    }

    // Update timesheet
    const timesheet = await timesheetService.updateTimesheet(id, validation.data)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: timesheet,
      message: 'Timesheet updated successfully',
    })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/v1/timesheets/[id]
 * Soft delete a timesheet
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params

    await timesheetService.deleteTimesheet(id)

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Timesheet deleted successfully',
    })
  } catch (error) {
    return handleError(error)
  }
}
