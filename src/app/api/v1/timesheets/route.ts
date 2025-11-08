import { NextRequest, NextResponse } from 'next/server'
import { timesheetService } from '@/services/timesheet.service'
import {
  createTimesheetSchema,
  bulkTimesheetSchema,
} from '@/validations/timesheetSchema'
import { handleError, validationError } from '@/lib/error'
import type { ApiResponse, PaginatedResponse } from '@/types/common'

/**
 * GET /api/v1/timesheets
 * List timesheets with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Extract filter parameters
    const projectId = searchParams.get('projectId') || undefined
    const taskId = searchParams.get('taskId') || undefined
    const userId = searchParams.get('userId') || undefined
    const billableParam = searchParams.get('billable')
    const billable = billableParam ? billableParam === 'true' : undefined
    const status = searchParams.get('status') || undefined
    const from = searchParams.get('from') || undefined
    const to = searchParams.get('to') || undefined

    // Extract pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const sort = searchParams.get('sort') || 'createdAt:desc'

    // Validate pagination
    if (page < 1 || pageSize < 1 || pageSize > 100) {
      return validationError('Invalid pagination parameters. Page must be >= 1 and pageSize between 1-100')
    }

    // Get timesheets
    const result = await timesheetService.getTimesheets(
      { projectId, taskId, userId, billable, status, from, to },
      page,
      pageSize,
      sort
    )

    return NextResponse.json<ApiResponse<PaginatedResponse<unknown>>>({
      success: true,
      data: result,
      message: `Retrieved ${result.data.length} timesheets`,
    })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/v1/timesheets
 * Create a new timesheet entry
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Check if this is a bulk creation request
    if (body.entries && Array.isArray(body.entries)) {
      // Validate bulk request
      const validation = bulkTimesheetSchema.safeParse(body)
      if (!validation.success) {
        return validationError('Invalid bulk timesheet data', validation.error.issues)
      }

      // Process bulk creation
      const result = await timesheetService.bulkCreateTimesheets(validation.data.entries)

      return NextResponse.json<ApiResponse>({
        success: true,
        data: result,
        message: `Bulk operation completed. Inserted: ${result.inserted}, Failed: ${result.failed}`,
      })
    }

    // Single timesheet creation
    const validation = createTimesheetSchema.safeParse(body)
    if (!validation.success) {
      return validationError('Invalid timesheet data', validation.error.issues)
    }

    const timesheet = await timesheetService.createTimesheet(validation.data)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: timesheet,
        message: 'Timesheet created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    return handleError(error)
  }
}
