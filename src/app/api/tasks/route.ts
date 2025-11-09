import { NextRequest, NextResponse } from 'next/server'
import { taskService } from '@/services/task.service'
import {
  successResponse,
  paginatedResponse,
  createdResponse,
} from '@/lib/response'
import { handleError } from '@/lib/error'
import {
  parseQuery,
  taskQuerySchema,
} from '@/lib/validation'
import { prisma } from '@/lib/prisma'
import { withAuth, checkProjectAccess } from '@/lib/middleware/auth'

/**
 * GET /api/tasks
 * Get all tasks with pagination and filters
 * Query params: page, pageSize, projectId, listId, assigneeId, status, priority, q
 * 
 * Permissions: 
 * - Admin/Finance: All tasks in their org
 * - Manager: All tasks in projects they manage
 * - Member: Only tasks assigned to them
 */
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await withAuth(req)
    if (error) return error

    const { searchParams } = new URL(req.url)
    const query = parseQuery(searchParams, taskQuerySchema)

    // Determine which projects the user can see tasks from
    let projectIds: number[] | undefined = undefined
    
    if (user!.role === 'manager') {
      // Managers can only see tasks from projects they manage
      const managedProjects = await prisma.project.findMany({
        where: {
          organizationId: user!.organizationId,
          projectManagerId: user!.id,
          deletedAt: null,
        },
        select: { id: true },
      })
      projectIds = managedProjects.map((p: { id: number }) => p.id)
      
      // If manager has no projects, return empty result
      if (projectIds && projectIds.length === 0) {
        return NextResponse.json({ 
          success: true, 
          data: [], 
          meta: { page: 1, pageSize: query.pageSize, total: 0, totalPages: 0 } 
        })
      }
    }

    const result = await taskService.getTasks(
      query.page,
      query.pageSize,
      {
        projectId: query.projectId,
        projectIds, // Pass array of project IDs for manager filtering
        assigneeId: query.assigneeId || (user!.role === 'member' ? user!.id : undefined),
        status: query.status,
        priority: query.priority,
        search: query.q,
        organizationId: user!.organizationId,
      }
    )
    
    
    // Transform into frontend TaskModel shape
    const priorityMap: Record<number, 'low' | 'medium' | 'high'> = { 1: 'low', 2: 'medium', 3: 'high', 4: 'high' }
  const data = result.data.map((t: any) => {
      const dueDateStr = t.dueDate
        ? new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : ''
      return {
        id: t.id,
        title: t.title,
        description: t.description || '',
        priority: priorityMap[t.priority] || 'medium',
        assignedTo: t.assignee?.name || 'Unassigned',
        assigneeId: t.assignee?.id ?? null,
        dueDate: dueDateStr,
        projectName: t.project?.name || 'Unknown Project',
        status: t.status,
        hoursLogged: t.hoursLogged ? Number(t.hoursLogged) : 0,
        expenses: [],
      }
    })
    return NextResponse.json({ success: true, data, meta: result.pagination })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/tasks
 * Create a new task
 * 
 * Permissions: Admin or Manager only
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication and permissions
    const { user, error } = await withAuth(req, {
      requirePermissions: ["canCreateTasks"],
    });
    if (error) return error;

    // Parse request body
    const body = await req.json();

    // Verify project exists and user has access
    const projectError = await checkProjectAccess(user!, body.projectId, prisma);
    if (projectError) return projectError;

    // Create task in database
    const task = await taskService.createTask(body);

    return createdResponse(task);
  } catch (err) {
    return handleError(err);
  }
}