import { prisma } from '@/lib/prisma'
import { createAuditEvent, updateWithOptimisticLocking } from '@/lib/db-helpers'
import type { Project, Prisma } from '@prisma/client'
import type { PaginatedResponse } from '@/types/common'

export interface CreateProjectInput {
  organizationId: string
  name: string
  code?: string
  description?: string
  projectManagerId?: string
  startDate?: Date
  endDate?: Date
  budget?: number
  status?: string
}

export interface UpdateProjectInput {
  name?: string
  code?: string
  description?: string
  projectManagerId?: string
  startDate?: Date
  endDate?: Date
  budget?: number
  status?: string
  progressPct?: number
}

/**
 * Project Service - handles business logic for projects
 */
export class ProjectService {
  /**
   * Get all projects for an organization with pagination
   */
  async getProjects(
    organizationId: string,
    page: number = 1,
    pageSize: number = 20,
    filters?: {
      status?: string
      projectManagerId?: string
      search?: string
      userId?: number  // For filtering by member assignment
    }
  ): Promise<PaginatedResponse<Project>> {
    const skip = (page - 1) * pageSize
    const take = pageSize
    const orgId = parseInt(organizationId, 10)

    const where: Prisma.ProjectWhereInput = {
      organizationId: orgId,
      deletedAt: null,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.projectManagerId && { projectManagerId: parseInt(filters.projectManagerId, 10) }),
      ...(filters?.userId && {
        OR: [
          { projectManagerId: filters.userId },
          { members: { some: { userId: filters.userId } } },
        ],
      }),
      ...(filters?.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { code: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    }

    const [data, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take,
        include: {
          projectManager: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              tasks: true,
              members: true,
            },
          },
          tasks: {
            where: {
              status: { in: ['done', 'completed', 'closed'] },
              deletedAt: null,
            },
            select: {
              id: true,
            },
          },
          // Include financial data for budget calculations
          purchaseOrders: {
            where: { deletedAt: null },
            select: {
              totalAmount: true,
            },
          },
          vendorBills: {
            where: { deletedAt: null },
            select: {
              amount: true,
            },
          },
          expenses: {
            where: {
              deletedAt: null,
              status: { in: ['approved', 'paid'] },
              billable: false,
            },
            select: {
              amount: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.project.count({ where }),
    ])

    // Fetch attachments for each project (images only for display)
    const projectIds = data.map((p: any) => p.id)
    
    // First, let's debug what attachments exist for this organization
    const allAttachments = await prisma.attachment.findMany({
      where: {
        organizationId: orgId,
      },
      select: {
        id: true,
        ownerId: true,
        ownerType: true,
        fileUrl: true,
        fileName: true,
        status: true,
        mimeType: true,
      },
    })
    console.log('🔍 All attachments in org:', allAttachments)
    
    const attachments = await prisma.attachment.findMany({
      where: {
        ownerType: 'project',
        ownerId: { in: projectIds },
        status: 'active',
        mimeType: { startsWith: 'image/' },
      },
      select: {
        id: true,
        ownerId: true,
        fileUrl: true,
        fileName: true,
      },
      take: 3, // Limit to first 3 images per project for card display
    })

    // Group attachments by project ID
    const attachmentsByProject = attachments.reduce((acc: any, att: any) => {
      if (!acc[att.ownerId]) {
        acc[att.ownerId] = []
      }
      // Only add if fileUrl is not null
      if (acc[att.ownerId].length < 3 && att.fileUrl) {
        acc[att.ownerId].push(att.fileUrl)
      }
      return acc
    }, {})

    console.log('📷 Attachments fetched:', attachments.length, 'attachments')
    console.log('📷 Grouped by project:', attachmentsByProject)

    // Calculate actual costs for each project
    const projectsWithCalculatedCosts = data.map((project: any) => {
      const purchaseOrdersCost = project.purchaseOrders.reduce((sum: number, po: any) => sum + Number(po.totalAmount), 0)
      const billsCost = project.vendorBills.reduce((sum: number, bill: any) => sum + Number(bill.amount), 0)
      const expensesCost = project.expenses.reduce((sum: number, exp: any) => sum + Number(exp.amount), 0)
      const actualCost = purchaseOrdersCost + billsCost + expensesCost

      return {
        ...project,
        cachedCost: actualCost,
        images: attachmentsByProject[project.id] || [], // Add project images
      }
    })

    return {
      data: projectsWithCalculatedCosts,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  }

  /**
   * Get a single project by ID
   */
  async getProjectById(projectId: string, organizationId: string): Promise<Project | null> {
    const projId = parseInt(projectId, 10)
    const orgId = parseInt(organizationId, 10)
    
    return prisma.project.findFirst({
      where: {
        id: projId,
        organizationId: orgId,
        deletedAt: null,
      },
      include: {
        projectManager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    })
  }

  /**
   * Create a new project
   */
  async createProject(input: CreateProjectInput): Promise<Project> {
    const orgId = parseInt(input.organizationId, 10)
    const managerId = input.projectManagerId ? parseInt(input.projectManagerId, 10) : null
    
    const project = await prisma.$transaction(async (tx) => {
      // Create the project
      const newProject = await tx.project.create({
        data: {
          organizationId: orgId,
          name: input.name,
          code: input.code,
          description: input.description,
          projectManagerId: managerId,
          startDate: input.startDate,
          endDate: input.endDate,
          budget: input.budget,
          status: input.status || 'planned',
        },
      })

      // Create audit event
      await createAuditEvent(
        orgId,
        'project',
        newProject.id,
        'project.created',
        { projectId: newProject.id, name: newProject.name }
      )

      return newProject
    })

    return project
  }

  /**
   * Update a project with optimistic locking
   */
  async updateProject(
    projectId: string,
    organizationId: string,
    version: number,
    input: UpdateProjectInput
  ): Promise<{ success: boolean; project?: Project; error?: string }> {
    try {
      const projId = parseInt(projectId, 10)
      const orgId = parseInt(organizationId, 10)
      const updatedInput = {
        ...input,
        ...(input.projectManagerId && { projectManagerId: parseInt(input.projectManagerId, 10) }),
        updatedAt: new Date(),
      }
      
      const success = await updateWithOptimisticLocking(
        prisma.project,
        projId,
        version,
        updatedInput
      )

      if (!success) {
        return {
          success: false,
          error: 'Version mismatch - project was updated by another user',
        }
      }

      const project = await this.getProjectById(projectId, organizationId)
      
      if (project) {
        await createAuditEvent(
          orgId,
          'project',
          projId,
          'project.updated',
          { projectId: projId, changes: input }
        )
      }

      return { success: true, project: project || undefined }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Soft delete a project
   */
  async deleteProject(projectId: string, organizationId: string): Promise<boolean> {
    try {
      const projId = parseInt(projectId, 10)
      const orgId = parseInt(organizationId, 10)
      
      await prisma.$transaction(async (tx) => {
        await tx.project.update({
          where: { id: projId, organizationId: orgId },
          data: { deletedAt: new Date() },
        })

        await createAuditEvent(
          orgId,
          'project',
          projId,
          'project.deleted',
          { projectId: projId }
        )
      })

      return true
    } catch (error) {
      console.error('Failed to delete project:', error)
      return false
    }
  }

  /**
   * Add a member to a project
   */
  async addProjectMember(
    projectId: string,
    userId: string,
    roleInProject?: string
  ): Promise<boolean> {
    try {
      const projId = parseInt(projectId, 10)
      const usrId = parseInt(userId, 10)
      
      await prisma.projectMember.create({
        data: {
          projectId: projId,
          userId: usrId,
          roleInProject,
        },
      })
      return true
    } catch (error) {
      console.error('Failed to add project member:', error)
      return false
    }
  }

  /**
   * Remove a member from a project
   */
  async removeProjectMember(projectId: string, userId: string): Promise<boolean> {
    try {
      const projId = parseInt(projectId, 10)
      const usrId = parseInt(userId, 10)
      
      await prisma.projectMember.deleteMany({
        where: {
          projectId: projId,
          userId: usrId,
        },
      })
      return true
    } catch (error) {
      console.error('Failed to remove project member:', error)
      return false
    }
  }

  /**
   * Get project statistics
   */
  async getProjectStats(projectId: string) {
    const projId = parseInt(projectId, 10)
    
    const [taskStats, timesheetStats, financialStats] = await Promise.all([
      // Task statistics
      prisma.task.groupBy({
        by: ['status'],
        where: {
          projectId: projId,
          deletedAt: null,
        },
        _count: true,
      }),
      
      // Timesheet statistics
      prisma.timesheet.aggregate({
        where: { projectId: projId },
        _sum: {
          hours: true,
          cost: true,
        },
      }),
      
      // Financial statistics
      prisma.project.findUnique({
        where: { id: projId },
        select: {
          budget: true,
          cachedRevenue: true,
          cachedCost: true,
          cachedProfit: true,
          cachedHoursLogged: true,
        },
      }),
    ])

    return {
      tasks: taskStats,
      timesheets: timesheetStats,
      financial: financialStats,
    }
  }
}

export const projectService = new ProjectService()
