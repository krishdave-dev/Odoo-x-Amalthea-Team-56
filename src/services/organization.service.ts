import { prisma } from '@/lib/prisma'
import { createAuditEvent } from '@/lib/db-helpers'
import type { Organization, Prisma } from '@prisma/client'
import type { PaginatedResponse } from '@/types/common'

export interface CreateOrganizationInput {
  name: string
  currency?: string
  timezone?: string
}

export interface UpdateOrganizationInput {
  name?: string
  currency?: string
  timezone?: string
}

/**
 * Organization Service - handles business logic for organizations
 */
export class OrganizationService {
  /**
   * Get all organizations with pagination and search
   */
  async getOrganizations(
    page: number = 1,
    pageSize: number = 25,
    search?: string,
    includeProjects?: boolean
  ): Promise<PaginatedResponse<Organization>> {
    const skip = (page - 1) * pageSize
    const take = pageSize

    const where: Prisma.OrganizationWhereInput = search
      ? {
          name: { contains: search, mode: 'insensitive' },
        }
      : {}

    const [data, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        skip,
        take,
        include: {
          _count: {
            select: {
              users: true,
              projects: true,
            },
          },
          ...(includeProjects && {
            projects: {
              where: { deletedAt: null },
              select: {
                id: true,
                name: true,
                status: true,
                createdAt: true,
              },
              take: 10, // Limit to prevent large payloads
            },
          }),
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.organization.count({ where }),
    ])

    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  }

  /**
   * Get a single organization by ID
   */
  async getOrganizationById(
    id: string,
    includeProjects?: boolean
  ): Promise<Organization | null> {
    return prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            projects: true,
            salesOrders: true,
          },
        },
        ...(includeProjects && {
          projects: {
            where: { deletedAt: null },
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
            },
          },
        }),
      },
    })
  }

  /**
   * Create a new organization
   */
  async createOrganization(input: CreateOrganizationInput): Promise<Organization> {
    const organization = await prisma.$transaction(async (tx) => {
      const newOrg = await tx.organization.create({
        data: {
          name: input.name,
          currency: input.currency || 'INR',
          timezone: input.timezone || 'Asia/Kolkata',
        },
      })

      // Create audit event
      await tx.event.create({
        data: {
          organizationId: newOrg.id,
          entityType: 'organization',
          entityId: newOrg.id,
          eventType: 'organization.created',
          payload: { organizationId: newOrg.id, name: newOrg.name },
        },
      })

      return newOrg
    })

    return organization
  }

  /**
   * Update an organization
   */
  async updateOrganization(
    id: string,
    input: UpdateOrganizationInput
  ): Promise<Organization | null> {
    const organization = await prisma.$transaction(async (tx) => {
      const updated = await tx.organization.update({
        where: { id },
        data: {
          ...input,
          updatedAt: new Date(),
        },
      })

      // Create audit event
      await tx.event.create({
        data: {
          organizationId: id,
          entityType: 'organization',
          entityId: id,
          eventType: 'organization.updated',
          payload: { organizationId: id, changes: input },
        },
      })

      return updated
    })

    return organization
  }

  /**
   * Delete an organization (hard delete - use with caution)
   */
  async deleteOrganization(id: string): Promise<boolean> {
    try {
      await prisma.$transaction(async (tx) => {
        // Delete in order to respect foreign key constraints
        // Note: Cascade deletes are configured in schema
        await tx.organization.delete({
          where: { id },
        })
      })

      return true
    } catch (error) {
      console.error('Failed to delete organization:', error)
      return false
    }
  }

  /**
   * Get organization statistics
   */
  async getOrganizationStats(id: string) {
    const [userStats, projectStats, financialStats] = await Promise.all([
      // User statistics
      prisma.user.groupBy({
        by: ['role'],
        where: {
          organizationId: id,
          deletedAt: null,
        },
        _count: true,
      }),

      // Project statistics
      prisma.project.groupBy({
        by: ['status'],
        where: {
          organizationId: id,
          deletedAt: null,
        },
        _count: true,
      }),

      // Financial aggregates
      prisma.project.aggregate({
        where: {
          organizationId: id,
          deletedAt: null,
        },
        _sum: {
          budget: true,
          cachedRevenue: true,
          cachedCost: true,
          cachedProfit: true,
          cachedHoursLogged: true,
        },
      }),
    ])

    return {
      users: userStats,
      projects: projectStats,
      financial: financialStats,
    }
  }
}

export const organizationService = new OrganizationService()
