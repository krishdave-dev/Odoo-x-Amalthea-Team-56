import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

/**
 * Optimistic locking helper - updates with version check
 * Returns true if update succeeded, false if version mismatch
 */
export async function updateWithOptimisticLocking<T extends { version: number }>(
  model: any,
  id: string | number,
  currentVersion: number,
  data: any
): Promise<boolean> {
  try {
    const result = await model.updateMany({
      where: {
        id,
        version: currentVersion,
      },
      data: {
        ...data,
        version: currentVersion + 1,
      },
    })
    return result.count > 0
  } catch (error) {
    console.error('Optimistic locking update failed:', error)
    return false
  }
}

/**
 * Soft delete helper
 */
export async function softDelete(model: any, id: string): Promise<boolean> {
  try {
    await model.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
    return true
  } catch (error) {
    console.error('Soft delete failed:', error)
    return false
  }
}

/**
 * Create audit event helper
 */
export async function createAuditEvent(
  organizationId: number,
  entityType: string,
  entityId: number | null,
  eventType: string,
  payload?: any
) {
  return prisma.event.create({
    data: {
      organizationId,
      entityType,
      entityId,
      eventType,
      payload: payload || {},
    },
  })
}

/**
 * Transaction wrapper with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 100
): Promise<T> {
  let lastError: Error | undefined
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
      }
    }
  }
  
  throw lastError
}

/**
 * Pagination helper
 */
export function getPaginationParams(page: number = 1, pageSize: number = 20) {
  const skip = (page - 1) * pageSize
  const take = pageSize
  return { skip, take }
}

/**
 * Calculate total pages
 */
export function calculateTotalPages(total: number, pageSize: number): number {
  return Math.ceil(total / pageSize)
}
