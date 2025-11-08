import { prisma } from '@/lib/prisma'
import { createAuditEvent, softDelete } from '@/lib/db-helpers'
import type { User, Prisma } from '@prisma/client'
import type { PaginatedResponse } from '@/types/common'

export interface CreateUserInput {
  organizationId: string
  email: string
  name?: string
  passwordHash?: string
  role: string
  hourlyRate?: number
  isActive?: boolean
}

export interface UpdateUserInput {
  email?: string
  name?: string
  role?: string
  hourlyRate?: number
  isActive?: boolean
}

/**
 * User Service - handles business logic for users
 */
export class UserService {
  /**
   * Get all users with pagination, search, and filters
   */
  async getUsers(
    organizationId: string,
    page: number = 1,
    pageSize: number = 25,
    filters?: {
      role?: string
      isActive?: boolean
      search?: string
    }
  ): Promise<PaginatedResponse<User>> {
    const skip = (page - 1) * pageSize
    const take = pageSize

    const where: Prisma.UserWhereInput = {
      organizationId,
      deletedAt: null,
      ...(filters?.role && { role: filters.role }),
      ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters?.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    }

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          organizationId: true,
          email: true,
          name: true,
          role: true,
          hourlyRate: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          // Exclude passwordHash from responses
          _count: {
            select: {
              managedProjects: true,
              projectMembers: true,
              assignedTasks: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ])

    return {
      data: data as User[],
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  }

  /**
   * Get a single user by ID
   */
  async getUserById(
    userId: string,
    organizationId: string
  ): Promise<Partial<User> | null> {
    return prisma.user.findFirst({
      where: {
        id: userId,
        organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        organizationId: true,
        email: true,
        name: true,
        role: true,
        hourlyRate: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Exclude passwordHash
        projectMembers: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
        managedProjects: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            endDate: true,
          },
        },
        _count: {
          select: {
            assignedTasks: true,
            timesheets: true,
          },
        },
      },
    })
  }

  /**
   * Create a new user
   */
  async createUser(input: CreateUserInput): Promise<Partial<User>> {
    const user = await prisma.$transaction(async (tx) => {
      // Check for duplicate email within organization
      const existing = await tx.user.findFirst({
        where: {
          organizationId: input.organizationId,
          email: input.email,
          deletedAt: null,
        },
      })

      if (existing) {
        throw new Error('A user with this email already exists in this organization')
      }

      const newUser = await tx.user.create({
        data: {
          organizationId: input.organizationId,
          email: input.email,
          name: input.name,
          passwordHash: input.passwordHash,
          role: input.role,
          hourlyRate: input.hourlyRate || 0,
          isActive: input.isActive ?? true,
        },
        select: {
          id: true,
          organizationId: true,
          email: true,
          name: true,
          role: true,
          hourlyRate: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      // Create audit event
      await createAuditEvent(
        input.organizationId,
        'user',
        newUser.id,
        'user.created',
        { userId: newUser.id, email: newUser.email }
      )

      return newUser
    })

    return user
  }

  /**
   * Update a user
   */
  async updateUser(
    userId: string,
    organizationId: string,
    input: UpdateUserInput
  ): Promise<Partial<User> | null> {
    const user = await prisma.$transaction(async (tx) => {
      // If updating email, check for duplicates
      if (input.email) {
        const existing = await tx.user.findFirst({
          where: {
            organizationId,
            email: input.email,
            id: { not: userId },
            deletedAt: null,
          },
        })

        if (existing) {
          throw new Error('A user with this email already exists in this organization')
        }
      }

      const updated = await tx.user.update({
        where: {
          id: userId,
          organizationId,
        },
        data: {
          ...input,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          organizationId: true,
          email: true,
          name: true,
          role: true,
          hourlyRate: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      // Create audit event
      await createAuditEvent(
        organizationId,
        'user',
        userId,
        'user.updated',
        { userId, changes: input }
      )

      return updated
    })

    return user
  }

  /**
   * Soft delete a user
   */
  async deleteUser(userId: string, organizationId: string): Promise<boolean> {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: {
            id: userId,
            organizationId,
          },
          data: {
            deletedAt: new Date(),
            isActive: false,
          },
        })

        await createAuditEvent(
          organizationId,
          'user',
          userId,
          'user.deleted',
          { userId }
        )
      })

      return true
    } catch (error) {
      console.error('Failed to delete user:', error)
      return false
    }
  }

  /**
   * Get user statistics and activity
   */
  async getUserStats(userId: string, organizationId: string) {
    const [taskStats, timesheetStats, projectCount] = await Promise.all([
      // Task statistics
      prisma.task.groupBy({
        by: ['status'],
        where: {
          assigneeId: userId,
          deletedAt: null,
        },
        _count: true,
      }),

      // Timesheet statistics (last 30 days)
      prisma.timesheet.aggregate({
        where: {
          userId,
          workDate: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        _sum: {
          hours: true,
          cost: true,
        },
        _count: true,
      }),

      // Project count
      prisma.projectMember.count({
        where: {
          userId,
        },
      }),
    ])

    return {
      tasks: taskStats,
      timesheets: timesheetStats,
      projectCount,
    }
  }
}

export const userService = new UserService()
