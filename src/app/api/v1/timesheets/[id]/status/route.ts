import { NextRequest, NextResponse } from 'next/server'
import { timesheetService } from '@/services/timesheet.service'
import { updateTimesheetStatusSchema } from '@/validations/timesheetSchema'
import { handleError, validationError } from '@/lib/error'
import type { ApiResponse } from '@/types/common'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * PATCH /api/v1/timesheets/[id]/status
 * Update timesheet status with validation
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Validate status
    const validation = updateTimesheetStatusSchema.safeParse(body)
    if (!validation.success) {
      return validationError('Invalid status', validation.error.issues)
    }

    // Update status
    const timesheet = await timesheetService.updateTimesheetStatus(id, validation.data.status)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: timesheet,
      message: `Timesheet status updated to ${validation.data.status}`,
    })
  } catch (error) {
    return handleError(error)
  }
}
