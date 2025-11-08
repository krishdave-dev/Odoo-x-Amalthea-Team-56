/**
 * CacheService - Hybrid In-Memory + Database Caching for Analytics
 * 
 * Features:
 * - Two-tier caching: Memory (fast) + DB (persistent)
 * - TTL-based expiration
 * - Cache invalidation by organization and type
 * - Performance tracking
 */

import { prisma } from '@/lib/prisma'

// In-memory cache store
const memoryCache = new Map<string, { data: unknown; expiresAt: Date }>()

// Default TTL: 10 minutes for memory, 15 minutes for DB
const DEFAULT_MEMORY_TTL = 10 * 60 * 1000 // 10 minutes in ms
const DEFAULT_DB_TTL = 15 * 60 * 1000 // 15 minutes in ms

export type CacheType = 
  | 'project_summary'
  | 'timesheet_summary' 
  | 'expense_summary'
  | 'finance_summary'
  | 'user_productivity'
  | 'organization_dashboard'

interface CacheOptions {
  memoryTTL?: number // milliseconds
  dbTTL?: number // milliseconds
  forceRefresh?: boolean
}

export class CacheService {
  /**
   * Generate cache key for memory store
   */
  private static getMemoryKey(organizationId: number, cacheType: CacheType): string {
    return `analytics:${organizationId}:${cacheType}`
  }

  /**
   * Get cached data (checks memory first, then DB)
   */
  static async get<T>(
    organizationId: number,
    cacheType: CacheType,
    options: CacheOptions = {}
  ): Promise<T | null> {
    const { forceRefresh = false } = options

    if (forceRefresh) {
      return null
    }

    // 1. Check in-memory cache first
    const memoryKey = this.getMemoryKey(organizationId, cacheType)
    const memoryEntry = memoryCache.get(memoryKey)

    if (memoryEntry && memoryEntry.expiresAt > new Date()) {
      console.log(`[Cache HIT - Memory] ${cacheType} for org ${organizationId}`)
      return memoryEntry.data as T
    }

    // 2. Check database cache
    const dbEntry = await prisma.analyticsCache.findUnique({
      where: {
        organizationId_cacheType: {
          organizationId,
          cacheType,
        },
      },
    })

    if (dbEntry && dbEntry.expiresAt > new Date()) {
      console.log(`[Cache HIT - DB] ${cacheType} for org ${organizationId}`)
      
      // Populate memory cache for next request
      memoryCache.set(memoryKey, {
        data: dbEntry.data,
        expiresAt: dbEntry.expiresAt,
      })

      return dbEntry.data as T
    }

    console.log(`[Cache MISS] ${cacheType} for org ${organizationId}`)
    return null
  }

  /**
   * Set cached data (stores in both memory and DB)
   */
  static async set<T>(
    organizationId: number,
    cacheType: CacheType,
    data: T,
    options: CacheOptions = {}
  ): Promise<void> {
    const {
      memoryTTL = DEFAULT_MEMORY_TTL,
      dbTTL = DEFAULT_DB_TTL,
    } = options

    const now = new Date()
    const memoryExpiresAt = new Date(now.getTime() + memoryTTL)
    const dbExpiresAt = new Date(now.getTime() + dbTTL)

    // 1. Store in memory cache
    const memoryKey = this.getMemoryKey(organizationId, cacheType)
    memoryCache.set(memoryKey, {
      data,
      expiresAt: memoryExpiresAt,
    })

    // 2. Store in database cache (upsert)
    await prisma.analyticsCache.upsert({
      where: {
        organizationId_cacheType: {
          organizationId,
          cacheType,
        },
      },
      update: {
        data: data as object,
        computedAt: now,
        expiresAt: dbExpiresAt,
      },
      create: {
        organizationId,
        cacheType,
        data: data as object,
        computedAt: now,
        expiresAt: dbExpiresAt,
      },
    })

    console.log(`[Cache SET] ${cacheType} for org ${organizationId}`)
  }

  /**
   * Invalidate cache for specific organization and type
   */
  static async invalidate(
    organizationId: number,
    cacheType?: CacheType
  ): Promise<void> {
    if (cacheType) {
      // Invalidate specific cache type
      const memoryKey = this.getMemoryKey(organizationId, cacheType)
      memoryCache.delete(memoryKey)

      await prisma.analyticsCache.deleteMany({
        where: {
          organizationId,
          cacheType,
        },
      })

      console.log(`[Cache INVALIDATE] ${cacheType} for org ${organizationId}`)
    } else {
      // Invalidate all caches for organization
      const pattern = `analytics:${organizationId}:`
      for (const key of memoryCache.keys()) {
        if (key.startsWith(pattern)) {
          memoryCache.delete(key)
        }
      }

      await prisma.analyticsCache.deleteMany({
        where: { organizationId },
      })

      console.log(`[Cache INVALIDATE ALL] for org ${organizationId}`)
    }
  }

  /**
   * Get or compute cached data (cache-aside pattern)
   */
  static async getOrCompute<T>(
    organizationId: number,
    cacheType: CacheType,
    computeFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<{ data: T; cached: boolean; computeDurationMs?: number }> {
    const startTime = Date.now()

    // Try to get from cache
    const cached = await this.get<T>(organizationId, cacheType, options)
    
    if (cached !== null) {
      return { data: cached, cached: true }
    }

    // Cache miss - compute fresh data
    const data = await computeFn()
    const computeDurationMs = Date.now() - startTime

    // Store in cache
    await this.set(organizationId, cacheType, data, options)

    // Update compute duration in DB
    await prisma.analyticsCache.updateMany({
      where: {
        organizationId,
        cacheType,
      },
      data: {
        computeDurationMs,
      },
    })

    return { data, cached: false, computeDurationMs }
  }

  /**
   * Clean up expired cache entries (run periodically via cron)
   */
  static async cleanExpired(): Promise<{ deletedCount: number }> {
    const now = new Date()

    // Clean memory cache
    let memoryDeleted = 0
    for (const [key, value] of memoryCache.entries()) {
      if (value.expiresAt <= now) {
        memoryCache.delete(key)
        memoryDeleted++
      }
    }

    // Clean database cache
    const result = await prisma.analyticsCache.deleteMany({
      where: {
        expiresAt: {
          lte: now,
        },
      },
    })

    const totalDeleted = memoryDeleted + result.count
    console.log(`[Cache CLEANUP] Deleted ${totalDeleted} expired entries (${memoryDeleted} memory, ${result.count} DB)`)

    return { deletedCount: totalDeleted }
  }

  /**
   * Get cache statistics
   */
  static async getStats(organizationId?: number): Promise<{
    memoryCount: number
    dbCount: number
    avgComputeDurationMs: number | null
    oldestEntry: Date | null
    newestEntry: Date | null
  }> {
    // Memory stats
    let memoryCount = 0
    if (organizationId) {
      const pattern = `analytics:${organizationId}:`
      for (const key of memoryCache.keys()) {
        if (key.startsWith(pattern)) {
          memoryCount++
        }
      }
    } else {
      memoryCount = memoryCache.size
    }

    // DB stats
    const where = organizationId ? { organizationId } : {}
    
    const [dbCount, avgResult, oldestEntry, newestEntry] = await Promise.all([
      prisma.analyticsCache.count({ where }),
      prisma.analyticsCache.aggregate({
        where,
        _avg: { computeDurationMs: true },
      }),
      prisma.analyticsCache.findFirst({
        where,
        orderBy: { computedAt: 'asc' },
        select: { computedAt: true },
      }),
      prisma.analyticsCache.findFirst({
        where,
        orderBy: { computedAt: 'desc' },
        select: { computedAt: true },
      }),
    ])

    return {
      memoryCount,
      dbCount,
      avgComputeDurationMs: avgResult._avg.computeDurationMs,
      oldestEntry: oldestEntry?.computedAt || null,
      newestEntry: newestEntry?.computedAt || null,
    }
  }
}

export const cacheService = CacheService
