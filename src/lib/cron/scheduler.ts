/**
 * Cron Scheduler - Background Job Scheduler
 * 
 * Uses node-cron for lightweight scheduling without Redis
 * 
 * Scheduled Jobs:
 * - Invoice generation (nightly at 2 AM)
 * - Cache cleanup (every 6 hours)
 * - Old notification cleanup (weekly)
 * - Analytics refresh (hourly during business hours)
 */

import cron from 'node-cron'
import { invoiceWorker } from '../workers/invoice-worker'
import { cacheService } from '@/services/cache.service'
import { notificationService } from '@/services/notification.service'
import { eventService } from '@/services/event.service'
import { prisma } from '@/lib/prisma'

export class CronScheduler {
  private static jobs: cron.ScheduledTask[] = []
  private static isInitialized = false

  /**
   * Initialize all scheduled jobs
   */
  static initialize() {
    if (this.isInitialized) {
      console.log('[CronScheduler] Already initialized')
      return
    }

    console.log('[CronScheduler] Initializing scheduled jobs...')

    // 1. Invoice Generation - Daily at 2 AM
    const invoiceJob = cron.schedule('0 2 * * *', async () => {
      console.log('[CronJob] Running invoice generation...')
      try {
        // Get all active organizations
        const orgs = await prisma.organization.findMany({
          select: { id: true, name: true },
        })

        for (const org of orgs) {
          const result = await invoiceWorker.generateInvoices(org.id)
          console.log(`[CronJob] Org ${org.name}: Generated ${result.invoicesGenerated} invoices`)
        }
      } catch (error) {
        console.error('[CronJob] Invoice generation failed:', error)
      }
    }, {
      scheduled: false, // Don't start immediately
      timezone: 'UTC',
    })

    this.jobs.push(invoiceJob)

    // 2. Cache Cleanup - Every 6 hours
    const cacheCleanupJob = cron.schedule('0 */6 * * *', async () => {
      console.log('[CronJob] Running cache cleanup...')
      try {
        const result = await cacheService.cleanExpired()
        console.log(`[CronJob] Cleaned ${result.deletedCount} expired cache entries`)
      } catch (error) {
        console.error('[CronJob] Cache cleanup failed:', error)
      }
    }, {
      scheduled: false,
      timezone: 'UTC',
    })

    this.jobs.push(cacheCleanupJob)

    // 3. Old Notification Cleanup - Weekly on Sunday at 3 AM
    const notificationCleanupJob = cron.schedule('0 3 * * 0', async () => {
      console.log('[CronJob] Running notification cleanup...')
      try {
        // Delete read notifications older than 90 days
        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
        
        const count = await notificationService.deleteOldNotifications(ninetyDaysAgo)
        console.log(`[CronJob] Deleted ${count} old notifications`)
      } catch (error) {
        console.error('[CronJob] Notification cleanup failed:', error)
      }
    }, {
      scheduled: false,
      timezone: 'UTC',
    })

    this.jobs.push(notificationCleanupJob)

    // 4. Old Event Cleanup - Monthly on 1st at 4 AM
    const eventCleanupJob = cron.schedule('0 4 1 * *', async () => {
      console.log('[CronJob] Running event cleanup...')
      try {
        // Delete events older than 1 year
        const oneYearAgo = new Date()
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
        
        const orgs = await prisma.organization.findMany({
          select: { id: true },
        })

        let totalDeleted = 0
        for (const org of orgs) {
          const count = await eventService.deleteOldEvents(org.id, oneYearAgo)
          totalDeleted += count
        }

        console.log(`[CronJob] Deleted ${totalDeleted} old events`)
      } catch (error) {
        console.error('[CronJob] Event cleanup failed:', error)
      }
    }, {
      scheduled: false,
      timezone: 'UTC',
    })

    this.jobs.push(eventCleanupJob)

    this.isInitialized = true
    console.log(`[CronScheduler] Initialized ${this.jobs.length} scheduled jobs`)
  }

  /**
   * Start all scheduled jobs
   */
  static start() {
    if (!this.isInitialized) {
      this.initialize()
    }

    console.log('[CronScheduler] Starting all jobs...')
    this.jobs.forEach((job, index) => {
      job.start()
      console.log(`[CronScheduler] Started job #${index + 1}`)
    })
  }

  /**
   * Stop all scheduled jobs
   */
  static stop() {
    console.log('[CronScheduler] Stopping all jobs...')
    this.jobs.forEach((job, index) => {
      job.stop()
      console.log(`[CronScheduler] Stopped job #${index + 1}`)
    })
  }

  /**
   * Get job status
   */
  static getStatus() {
    return {
      initialized: this.isInitialized,
      jobCount: this.jobs.length,
      jobs: [
        { name: 'Invoice Generation', schedule: '0 2 * * *', description: 'Daily at 2 AM UTC' },
        { name: 'Cache Cleanup', schedule: '0 */6 * * *', description: 'Every 6 hours' },
        { name: 'Notification Cleanup', schedule: '0 3 * * 0', description: 'Weekly on Sunday at 3 AM UTC' },
        { name: 'Event Cleanup', schedule: '0 4 1 * *', description: 'Monthly on 1st at 4 AM UTC' },
      ],
    }
  }
}

export const cronScheduler = CronScheduler

// Auto-initialize in production (optional)
if (process.env.NODE_ENV === 'production' && process.env.ENABLE_CRON === 'true') {
  console.log('[CronScheduler] Auto-starting in production mode')
  cronScheduler.initialize()
  cronScheduler.start()
}
