import { NextResponse } from 'next/server'
import { taskService } from '@/services/task.service'
import { successResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { uuidSchema } from '@/lib/validation'

/**
 * GET /api/projects/:projectId/tasks/kanban
 * Get tasks grouped by status for kanban board view
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    uuidSchema.parse(projectId)

    const grouped = await taskService.getTasksByStatus(projectId)

    return successResponse(grouped)
  } catch (error) {
    return handleError(error)
  }
}
