import { prisma } from '@/lib/prisma'
import { createAuditEvent } from '@/lib/db-helpers'
import type { TaskList, Prisma } from '@prisma/client'

export interface CreateTaskListInput {
  projectId: string
  title: string
  ordinal?: number
}

export interface UpdateTaskListInput {
  title?: string
  ordinal?: number
}

/**
 * TaskList Service - handles business logic for task lists
 */
export class TaskListService {
  /**
   * Get all task lists for a project
   */
  async getTaskLists(projectId: string): Promise<TaskList[]> {
    return prisma.taskList.findMany({
      where: { projectId },
      include: {
        _count: {
          select: {
            tasks: {
              where: { deletedAt: null },
            },
          },
        },
        tasks: {
          where: { deletedAt: null },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            assigneeId: true,
            dueDate: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10, // Limit to prevent large payloads
        },
      },
      orderBy: { ordinal: 'asc' },
    })
  }

  /**
   * Get a single task list by ID
   */
  async getTaskListById(listId: string): Promise<TaskList | null> {
    return prisma.taskList.findUnique({
      where: { id: listId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            organizationId: true,
          },
        },
        tasks: {
          where: { deletedAt: null },
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            tasks: {
              where: { deletedAt: null },
            },
          },
        },
      },
    })
  }

  /**
   * Create a new task list
   */
  async createTaskList(input: CreateTaskListInput): Promise<TaskList> {
    const taskList = await prisma.$transaction(async (tx) => {
      // Get project to access organizationId
      const project = await tx.project.findUnique({
        where: { id: input.projectId, deletedAt: null },
        select: { organizationId: true },
      })

      if (!project) {
        throw new Error('Project not found')
      }

      // If ordinal not specified, set it to max + 1
      let ordinal = input.ordinal
      if (ordinal === undefined) {
        const maxOrdinal = await tx.taskList.aggregate({
          where: { projectId: input.projectId },
          _max: { ordinal: true },
        })
        ordinal = (maxOrdinal._max.ordinal || 0) + 1
      }

      const newList = await tx.taskList.create({
        data: {
          projectId: input.projectId,
          title: input.title,
          ordinal,
        },
      })

      await createAuditEvent(
        project.organizationId,
        'task_list',
        newList.id,
        'task_list.created',
        { listId: newList.id, title: newList.title, projectId: input.projectId }
      )

      return newList
    })

    return taskList
  }

  /**
   * Update a task list
   */
  async updateTaskList(
    listId: string,
    input: UpdateTaskListInput
  ): Promise<TaskList | null> {
    const taskList = await prisma.$transaction(async (tx) => {
      // Get list with project info
      const existing = await tx.taskList.findUnique({
        where: { id: listId },
        include: {
          project: {
            select: { organizationId: true },
          },
        },
      })

      if (!existing) {
        return null
      }

      const updated = await tx.taskList.update({
        where: { id: listId },
        data: input,
      })

      await createAuditEvent(
        existing.project.organizationId,
        'task_list',
        listId,
        'task_list.updated',
        { listId, changes: input }
      )

      return updated
    })

    return taskList
  }

  /**
   * Delete a task list (soft delete all tasks within)
   */
  async deleteTaskList(listId: string): Promise<boolean> {
    try {
      await prisma.$transaction(async (tx) => {
        // Get list with project info
        const taskList = await tx.taskList.findUnique({
          where: { id: listId },
          include: {
            project: {
              select: { organizationId: true },
            },
          },
        })

        if (!taskList) {
          throw new Error('Task list not found')
        }

        // Soft delete all tasks in this list
        await tx.task.updateMany({
          where: {
            listId,
            deletedAt: null,
          },
          data: {
            deletedAt: new Date(),
          },
        })

        // Delete the task list itself
        await tx.taskList.delete({
          where: { id: listId },
        })

        await createAuditEvent(
          taskList.project.organizationId,
          'task_list',
          listId,
          'task_list.deleted',
          { listId }
        )
      })

      return true
    } catch (error) {
      console.error('Failed to delete task list:', error)
      return false
    }
  }

  /**
   * Reorder task lists
   */
  async reorderTaskLists(
    projectId: string,
    orderedListIds: string[]
  ): Promise<boolean> {
    try {
      await prisma.$transaction(async (tx) => {
        // Update each list with its new ordinal
        for (let i = 0; i < orderedListIds.length; i++) {
          await tx.taskList.update({
            where: {
              id: orderedListIds[i],
              projectId, // Ensure list belongs to project
            },
            data: {
              ordinal: i,
            },
          })
        }
      })

      return true
    } catch (error) {
      console.error('Failed to reorder task lists:', error)
      return false
    }
  }
}

export const taskListService = new TaskListService()
