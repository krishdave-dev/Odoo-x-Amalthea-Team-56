import { prisma } from '@/lib/prisma'
import { createAuditEvent, updateWithOptimisticLocking } from '@/lib/db-helpers'
import type { PaginatedResponse } from '@/types/common'

export interface CreateTaskInput {
  projectId: number
  listId?: number
  title: string
  description?: string
  assigneeId?: number
  priority?: number
  status?: string
  estimateHours?: number
  dueDate?: Date
  metadata?: Record<string, any>
}

export interface UpdateTaskInput {
  listId?: number
  title?: string
  description?: string
  assigneeId?: number | null
  priority?: number
  status?: string
  estimateHours?: number
  dueDate?: Date | null
  metadata?: Record<string, any>
}

/**
 * Valid task status transitions
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  new: ['in_progress', 'blocked'],
  in_progress: ['in_review', 'blocked', 'new'],
  in_review: ['completed', 'in_progress', 'blocked'],
  blocked: ['new', 'in_progress'],
  completed: ['in_progress'], // Allow reopening
}

/**
 * Task Service - handles business logic for tasks with state management
 */
export class TaskService {
  /**
   * Validate status transition
   */
  private validateStatusTransition(currentStatus: string, newStatus: string): void {
    if (currentStatus === newStatus) {
      return // No transition
    }

    const allowedTransitions = VALID_TRANSITIONS[currentStatus] || []
    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from "${currentStatus}" to "${newStatus}"`
      )
    }
  }

  /**
   * Get all tasks with pagination and filters
   */
  async getTasks(
    page: number = 1,
    pageSize: number = 25,
    filters?: {
      projectId?: number
      projectIds?: number[]
      listId?: number
      assigneeId?: number
      status?: string
      priority?: number
      search?: string
      organizationId?: number
    }
  ): Promise<PaginatedResponse<any>> {
    const skip = (page - 1) * pageSize
    const take = pageSize

    const where: any = {
      deletedAt: null,
      ...(filters?.projectId && { projectId: filters.projectId }),
      ...(filters?.projectIds && filters.projectIds.length > 0 && { 
        projectId: { in: filters.projectIds } 
      }),
      ...(filters?.listId && { listId: filters.listId }),
      ...(filters?.assigneeId && { assigneeId: filters.assigneeId }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.priority && { priority: filters.priority }),
      ...(filters?.search && {
        OR: [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    }
    
    // If organizationId is provided, ensure tasks are from that org's projects
    if (filters?.organizationId) {
      where.project = {
        organizationId: filters.organizationId,
        deletedAt: null,
      }
    }

    const [data, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take,
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          taskList: {
            select: {
              id: true,
              title: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.task.count({ where }),
    ])

    // Fetch attachments (images only) for all tasks
    const taskIds = data.map((task: any) => task.id)
    const attachments = taskIds.length > 0 ? await prisma.attachment.findMany({
      where: {
        ownerType: 'task',
        ownerId: { in: taskIds },
        status: 'active',
        mimeType: { startsWith: 'image/' },
      },
      select: {
        ownerId: true,
        fileUrl: true,
        fileName: true,
      },
      orderBy: { id: 'asc' },
      take: taskIds.length * 3, // Max 3 images per task
    }) : []

    // Group attachments by task (max 3 per task)
    const attachmentsByTask = attachments.reduce((acc: Record<number, string[]>, att: any) => {
      if (!acc[att.ownerId]) {
        acc[att.ownerId] = []
      }
      if (acc[att.ownerId].length < 3 && att.fileUrl) {
        acc[att.ownerId].push(att.fileUrl)
      }
      return acc
    }, {})

    // Add images to each task
    const tasksWithImages = data.map((task: any) => ({
      ...task,
      images: attachmentsByTask[task.id] || [],
    }))

    return {
      data: tasksWithImages,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  }

  /**
   * Get a single task by ID
   */
  async getTaskById(taskId: number): Promise<any | null> {
    return prisma.task.findFirst({
      where: {
        id: taskId,
        deletedAt: null,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        taskList: {
          select: {
            id: true,
            title: true,
            projectId: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            organizationId: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })
  }

  /**
   * Create a new task
   */
  async createTask(input: CreateTaskInput): Promise<any> {
    const task = await prisma.$transaction(async (tx: any) => {
      // Verify project exists
      const project = await tx.project.findUnique({
        where: { id: input.projectId, deletedAt: null },
        select: { organizationId: true },
      })

      if (!project) {
        throw new Error('Project not found')
      }

      // If listId provided, verify it belongs to the project
      if (input.listId) {
        const list = await tx.taskList.findFirst({
          where: {
            id: input.listId,
            projectId: input.projectId,
          },
        })

        if (!list) {
          throw new Error('Task list not found or does not belong to this project')
        }
      }

      // If assigneeId provided, verify user exists
      if (input.assigneeId) {
        const assignee = await tx.user.findFirst({
          where: {
            id: input.assigneeId,
            organizationId: project.organizationId,
            deletedAt: null,
          },
        })

        if (!assignee) {
          throw new Error('Assignee not found or does not belong to this organization')
        }
      }

      const newTask = await tx.task.create({
        data: {
          projectId: input.projectId,
          listId: input.listId,
          title: input.title,
          description: input.description,
          assigneeId: input.assigneeId,
          priority: input.priority || 2,
          status: input.status || 'new',
          estimateHours: input.estimateHours,
          dueDate: input.dueDate,
          metadata: input.metadata || {},
        },
      })

      // Create audit event
      await createAuditEvent(
        project.organizationId,
        'task',
        newTask.id,
        'task.created',
        {
          taskId: newTask.id,
          title: newTask.title,
          projectId: input.projectId,
          status: newTask.status,
        }
      )

      return newTask
    })

    return task
  }

  /**
   * Update a task with optimistic locking and state validation
   */
  async updateTask(
    taskId: number,
    version: number,
    input: UpdateTaskInput
  ): Promise<{ success: boolean; task?: any; error?: string }> {
    try {
      const result = await prisma.$transaction(async (tx: any) => {
        // Get current task
        const currentTask = await tx.task.findUnique({
          where: { id: taskId },
          include: {
            project: {
              select: { organizationId: true },
            },
          },
        })

        if (!currentTask) {
          throw new Error('Task not found')
        }

        // Validate status transition if status is being updated
        if (input.status && input.status !== currentTask.status) {
          this.validateStatusTransition(currentTask.status, input.status)
        }

        // If moving to different list, verify it exists and belongs to same project
        if (input.listId && input.listId !== currentTask.listId) {
          const list = await tx.taskList.findFirst({
            where: {
              id: input.listId,
              projectId: currentTask.projectId,
            },
          })

          if (!list) {
            throw new Error('Task list not found or does not belong to this project')
          }
        }

        // If changing assignee, verify they exist
        if (input.assigneeId !== undefined && input.assigneeId !== currentTask.assigneeId) {
          if (input.assigneeId !== null) {
            const assignee = await tx.user.findFirst({
              where: {
                id: input.assigneeId,
                organizationId: currentTask.project.organizationId,
                deletedAt: null,
              },
            })

            if (!assignee) {
              throw new Error('Assignee not found')
            }
          }
        }

        // Update with optimistic locking
        const success = await updateWithOptimisticLocking(
          tx.task,
          taskId,
          version,
          {
            ...input,
            updatedAt: new Date(),
          }
        )

        if (!success) {
          return {
            success: false,
            error: 'Version mismatch - task was updated by another user',
          }
        }

        const updatedTask = await tx.task.findUnique({
          where: { id: taskId },
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        })

        // Create audit event for status changes
        if (input.status && input.status !== currentTask.status) {
          await createAuditEvent(
            currentTask.project.organizationId,
            'task',
            taskId,
            'task.status_changed',
            {
              taskId,
              fromStatus: currentTask.status,
              toStatus: input.status,
            }
          )
        }

        // Create general update event
        await createAuditEvent(
          currentTask.project.organizationId,
          'task',
          taskId,
          'task.updated',
          { taskId, changes: input }
        )

        return {
          success: true,
          task: updatedTask || undefined,
        }
      })

      return result
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update failed',
      }
    }
  }

  /**
   * Soft delete a task
   */
  async deleteTask(taskId: number): Promise<boolean> {
    try {
      await prisma.$transaction(async (tx: any) => {
        const task = await tx.task.findUnique({
          where: { id: taskId },
          include: {
            project: {
              select: { organizationId: true },
            },
          },
        })

        if (!task) {
          throw new Error('Task not found')
        }

        await tx.task.update({
          where: { id: taskId },
          data: { deletedAt: new Date() },
        })

        await createAuditEvent(
          task.project.organizationId,
          'task',
          taskId,
          'task.deleted',
          { taskId }
        )
      })

      return true
    } catch (error) {
      console.error('Failed to delete task:', error)
      return false
    }
  }

  /**
   * Get tasks grouped by status (kanban board view)
   */
  async getTasksByStatus(projectId: number) {
    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        deletedAt: null,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        taskList: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    // Group by status
    const grouped: Record<string, any[]> = {
      new: [],
      in_progress: [],
      in_review: [],
      blocked: [],
      completed: [],
    }

    tasks.forEach((task: any) => {
      if (grouped[task.status]) {
        grouped[task.status].push(task)
      } else {
        grouped[task.status] = [task]
      }
    })

    return grouped
  }
}

export const taskService = new TaskService()
