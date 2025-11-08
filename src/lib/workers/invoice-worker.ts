/**
 * Invoice Generation Worker
 * 
 * Purpose: Automatically generate invoices from billable timesheets
 * 
 * Triggers:
 * - Scheduled via cron (nightly at 2 AM)
 * - Manual trigger via admin API
 * 
 * Process:
 * 1. Find projects with approved billable timesheets
 * 2. Aggregate timesheet costs
 * 3. Generate CustomerInvoice records
 * 4. Log events for audit trail
 * 5. Send notifications to project managers
 */

import { prisma } from '@/lib/prisma'
import { eventService, EventType, EntityType } from '@/services/event.service'
import { notificationService } from '@/services/notification.service'

export interface InvoiceGenerationResult {
  success: boolean
  invoicesGenerated: number
  totalAmount: number
  errors: string[]
}

export class InvoiceWorker {
  /**
   * Generate invoices for an organization
   */
  static async generateInvoices(organizationId: number): Promise<InvoiceGenerationResult> {
    const errors: string[] = []
    let invoicesGenerated = 0
    let totalAmount = 0

    try {
      console.log(`[InvoiceWorker] Starting invoice generation for org ${organizationId}`)

      // Find projects with approved billable timesheets that haven't been invoiced
      const projects = await prisma.project.findMany({
        where: {
          organizationId,
          deletedAt: null,
          status: {
            in: ['active', 'completed'],
          },
        },
        include: {
          timesheets: {
            where: {
              billable: true,
              status: 'approved',
              deletedAt: null,
            },
          },
          projectManager: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      console.log(`[InvoiceWorker] Found ${projects.length} projects to process`)

      // Process each project
      for (const project of projects) {
        try {
          // Skip if no billable timesheets
          if (project.timesheets.length === 0) {
            continue
          }

          // Calculate total from timesheets
          const invoiceAmount = project.timesheets.reduce(
            (sum, t) => sum + Number(t.costAtTime),
            0
          )

          // Skip if amount is zero
          if (invoiceAmount <= 0) {
            continue
          }

          // Generate invoice number
          const timestamp = Date.now()
          const invoiceNumber = `INV-${organizationId}-${project.id}-${timestamp}`

          // Create invoice in transaction
          const invoice = await prisma.$transaction(async (tx) => {
            // Create invoice
            const newInvoice = await tx.customerInvoice.create({
              data: {
                organizationId,
                projectId: project.id,
                invoiceNumber,
                amount: invoiceAmount,
                status: 'draft',
                invoiceDate: new Date(),
                metadata: {
                  generatedBy: 'auto-worker',
                  timesheetIds: project.timesheets.map(t => t.id),
                  timesheetCount: project.timesheets.length,
                  generatedAt: new Date().toISOString(),
                },
              },
            })

            // Update project cached revenue
            await tx.project.update({
              where: { id: project.id },
              data: {
                cachedRevenue: {
                  increment: invoiceAmount,
                },
              },
            })

            return newInvoice
          })

          // Log event
          await eventService.logEvent(
            organizationId,
            EntityType.INVOICE,
            invoice.id,
            EventType.INVOICE_CREATED,
            {
              invoiceNumber,
              amount: invoiceAmount.toString(),
              projectId: project.id,
              projectName: project.name,
              timesheetCount: project.timesheets.length,
              generatedBy: 'auto-worker',
            }
          )

          // Notify project manager
          if (project.projectManager) {
            await notificationService.notifyInvoiceGenerated(
              organizationId,
              project.projectManager.id,
              invoice.id,
              invoiceNumber,
              invoiceAmount
            )
          }

          invoicesGenerated++
          totalAmount += invoiceAmount

          console.log(`[InvoiceWorker] Generated invoice ${invoiceNumber} for project ${project.name}: $${invoiceAmount}`)
        } catch (error) {
          const errorMsg = `Failed to generate invoice for project ${project.id}: ${error}`
          console.error(`[InvoiceWorker] ${errorMsg}`)
          errors.push(errorMsg)
        }
      }

      console.log(`[InvoiceWorker] Completed: ${invoicesGenerated} invoices, total: $${totalAmount}`)

      return {
        success: true,
        invoicesGenerated,
        totalAmount,
        errors,
      }
    } catch (error) {
      console.error('[InvoiceWorker] Fatal error:', error)
      return {
        success: false,
        invoicesGenerated,
        totalAmount,
        errors: [...errors, `Fatal error: ${error}`],
      }
    }
  }

  /**
   * Generate invoice for a specific project
   */
  static async generateInvoiceForProject(
    organizationId: number,
    projectId: number
  ): Promise<{ success: boolean; invoiceId?: number; error?: string }> {
    try {
      // Fetch project with billable timesheets
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          organizationId,
          deletedAt: null,
        },
        include: {
          timesheets: {
            where: {
              billable: true,
              status: 'approved',
              deletedAt: null,
            },
          },
          projectManager: {
            select: { id: true },
          },
        },
      })

      if (!project) {
        return { success: false, error: 'Project not found' }
      }

      if (project.timesheets.length === 0) {
        return { success: false, error: 'No billable timesheets found' }
      }

      const invoiceAmount = project.timesheets.reduce(
        (sum, t) => sum + Number(t.costAtTime),
        0
      )

      const invoiceNumber = `INV-${organizationId}-${projectId}-${Date.now()}`

      const invoice = await prisma.customerInvoice.create({
        data: {
          organizationId,
          projectId,
          invoiceNumber,
          amount: invoiceAmount,
          status: 'draft',
          invoiceDate: new Date(),
          metadata: {
            generatedBy: 'manual-worker',
            timesheetIds: project.timesheets.map(t => t.id),
            timesheetCount: project.timesheets.length,
          },
        },
      })

      // Log and notify
      await eventService.logEvent(
        organizationId,
        EntityType.INVOICE,
        invoice.id,
        EventType.INVOICE_CREATED,
        { invoiceNumber, amount: invoiceAmount.toString(), projectId }
      )

      if (project.projectManager) {
        await notificationService.notifyInvoiceGenerated(
          organizationId,
          project.projectManager.id,
          invoice.id,
          invoiceNumber,
          invoiceAmount
        )
      }

      return { success: true, invoiceId: invoice.id }
    } catch (error) {
      return { success: false, error: `${error}` }
    }
  }
}

export const invoiceWorker = InvoiceWorker
