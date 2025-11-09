import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/session";
import { successResponse, errorResponse } from "@/lib/response";

/**
 * POST /api/timesheets/recalculate-expenses
 * Recalculate and create expenses for all timesheets that don't have them
 * Admin only
 */
export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return errorResponse("Unauthorized", 401);
    }

    // Only admins can recalculate expenses
    if (currentUser.role !== "admin") {
      return errorResponse("Only admins can recalculate expenses", 403);
    }

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Get all timesheets with their user's current hourly rate
      const timesheets = await tx.timesheet.findMany({
        where: {
          deletedAt: null,
          project: {
            organizationId: currentUser.organizationId,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              hourlyRate: true,
            },
          },
          task: {
            select: {
              id: true,
              title: true,
            },
          },
          project: {
            select: {
              id: true,
              organizationId: true,
            },
          },
        },
      });

      let timesheetsUpdated = 0;
      let expensesCreated = 0;
      let expensesUpdated = 0;

      for (const ts of timesheets) {
        const hourlyRate = parseFloat(ts.user.hourlyRate.toString());
        const durationHours = parseFloat(ts.durationHours.toString());
        const newCost = hourlyRate * durationHours;

        // Update timesheet cost if different
        if (parseFloat(ts.costAtTime.toString()) !== newCost) {
          await tx.timesheet.update({
            where: { id: ts.id },
            data: { costAtTime: newCost },
          });
          timesheetsUpdated++;
        }

        // Only create/update expenses if hourly rate > 0
        if (hourlyRate > 0) {
          // Check if expense exists for this timesheet
          const existingExpense = await tx.expense.findFirst({
            where: {
              userId: ts.userId,
              projectId: ts.projectId,
              createdAt: {
                gte: new Date(ts.createdAt.getTime() - 2000), // Within 2 seconds
                lte: new Date(ts.createdAt.getTime() + 2000),
              },
              note: {
                contains: `${ts.durationHours}h`,
              },
            },
          });

          if (!existingExpense && ts.task) {
            // Create new expense
            await tx.expense.create({
              data: {
                organizationId: ts.project.organizationId,
                projectId: ts.projectId,
                userId: ts.userId,
                amount: newCost,
                billable: true,
                status: 'submitted',
                note: `Timesheet hours: ${ts.durationHours}h on task "${ts.task.title}"${ts.notes ? ` - ${ts.notes}` : ''}`,
                submittedAt: ts.createdAt,
              },
            });
            expensesCreated++;
          } else if (existingExpense && parseFloat(existingExpense.amount.toString()) !== newCost) {
            // Update expense amount if different
            await tx.expense.update({
              where: { id: existingExpense.id },
              data: { amount: newCost },
            });
            expensesUpdated++;
          }
        }
      }

      return {
        timesheetsUpdated,
        expensesCreated,
        expensesUpdated,
        totalTimesheets: timesheets.length,
      };
    });

    return successResponse({
      message: "Expenses recalculated successfully",
      stats: result,
    });
  } catch (error) {
    console.error("Error recalculating expenses:", error);
    return errorResponse("Internal server error", 500);
  }
}
