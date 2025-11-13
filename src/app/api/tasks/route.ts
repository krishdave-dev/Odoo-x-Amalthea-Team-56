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
    
    // Mock data for assignedBy and tags (since we don't have createdBy in schema)
    const mockAssigners = ['Chhaya Zala', 'Kaushik Nath', 'Maulika Patel', 'Priyang Bhatt'];
    const mockTags = [
      ['Frontend', 'React'],
      ['Backend', 'API'],
      ['Database', 'Migration'],
      ['UI/UX', 'Design'],
      ['Bug', 'Critical'],
      ['Feature', 'Enhancement'],
      ['Testing', 'QA'],
      ['Documentation'],
    ];
    const mockDescriptions = [
      'Implement responsive navigation component with mobile menu support and accessibility features',
      'Create RESTful API endpoints for user authentication and authorization with JWT tokens',
      'Refactor database schema to optimize query performance and reduce data redundancy',
      'Design and implement new dashboard layout with improved UX and data visualization',
      'Fix critical bug causing application crashes on Safari browsers during form submission',
      'Add new feature for bulk data export with progress tracking and cancellation support',
      'Write comprehensive unit and integration tests to improve code coverage above 80%',
      'Update technical documentation and API reference with latest changes and examples',
      'Integrate third-party payment gateway with secure transaction handling and error recovery',
      'Optimize image loading performance using lazy loading and progressive enhancement',
    ];
    
    const data = result.data.map((t: any, index: number) => {
      const dueDateStr = t.dueDate
        ? new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : ''
      return {
        id: t.id,
        title: t.title,
        description: t.description || mockDescriptions[index % mockDescriptions.length], // Use mock description if none exists
        priority: priorityMap[t.priority] || 'medium',
        assignedTo: t.assignee?.name || 'Unassigned',
        assigneeId: t.assignee?.id ?? null,
        assignedBy: mockAssigners[index % mockAssigners.length], // Mock assigned by
        tags: mockTags[index % mockTags.length], // Mock tags
        dueDate: dueDateStr,
        projectName: t.project?.name || 'Unknown Project',
        status: t.status,
        hoursLogged: t.hoursLogged ? Number(t.hoursLogged) : 0,
        expenses: [],
      }
    })
    
    const response = NextResponse.json({ success: true, data, meta: result.pagination })
    // Prevent caching to ensure fresh data
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
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