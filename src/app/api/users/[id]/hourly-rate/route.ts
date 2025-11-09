import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/session";
import { successResponse, errorResponse } from "@/lib/response";

// GET user's hourly rate
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return errorResponse("Unauthorized", 401);
    }

    const params = await context.params;
    const userId = parseInt(params.id);

    if (isNaN(userId)) {
      return errorResponse("Invalid user ID", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        hourlyRate: true,
        organizationId: true,
      },
    });

    if (!user) {
      return errorResponse("User not found", 404);
    }

    // Check if user is in the same organization
    if (user.organizationId !== currentUser.organizationId) {
      return errorResponse("Forbidden", 403);
    }

    return successResponse({ hourlyRate: user.hourlyRate });
  } catch (error) {
    console.error("Error fetching hourly rate:", error);
    return errorResponse("Internal server error", 500);
  }
}

// PUT/PATCH - Update user's hourly rate (admin only)
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return errorResponse("Unauthorized", 401);
    }

    // Only admins can update hourly rates
    if (currentUser.role !== "admin") {
      return errorResponse("Only admins can update hourly rates", 403);
    }

    const params = await context.params;
    const userId = parseInt(params.id);

    if (isNaN(userId)) {
      return errorResponse("Invalid user ID", 400);
    }

    const body = await req.json();
    const { hourlyRate } = body;

    if (hourlyRate === undefined || hourlyRate === null) {
      return errorResponse("Hourly rate is required", 400);
    }

    const rate = parseFloat(hourlyRate);
    if (isNaN(rate) || rate < 0) {
      return errorResponse("Invalid hourly rate. Must be a positive number", 400);
    }

    // Check if user exists and is in the same organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    if (!user) {
      return errorResponse("User not found", 404);
    }

    if (user.organizationId !== currentUser.organizationId) {
      return errorResponse("Forbidden", 403);
    }

    // Update hourly rate
    const updatedUser = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update the user's hourly rate
      const user = await tx.user.update({
        where: { id: userId },
        data: { hourlyRate: rate },
        select: {
          id: true,
          name: true,
          email: true,
          hourlyRate: true,
        },
      });

      // Recalculate costs for all existing timesheets in draft status
      const existingTimesheets = await tx.timesheet.findMany({
        where: {
          userId: userId,
          status: 'draft', // Only update draft timesheets
          deletedAt: null,
        },
        select: {
          id: true,
          durationHours: true,
        },
      });

      // Update each timesheet's cost
      for (const timesheet of existingTimesheets) {
        const newCost = parseFloat(timesheet.durationHours.toString()) * rate;
        await tx.timesheet.update({
          where: { id: timesheet.id },
          data: { costAtTime: newCost },
        });
      }

      // Create or update expenses for timesheets that didn't have them
      // Get timesheets that need expenses created
      const timesheetsNeedingExpenses = await tx.timesheet.findMany({
        where: {
          userId: userId,
          status: 'draft',
          deletedAt: null,
        },
        include: {
          task: {
            select: {
              id: true,
              title: true,
              projectId: true,
            },
          },
          project: {
            select: {
              organizationId: true,
            },
          },
        },
      });

      // For each timesheet, create or update expense if rate > 0
      if (rate > 0) {
        for (const ts of timesheetsNeedingExpenses) {
          const expenseAmount = parseFloat(ts.durationHours.toString()) * rate;
          
          // Check if expense already exists for this user and time period
          const existingExpense = await tx.expense.findFirst({
            where: {
              userId: userId,
              projectId: ts.projectId,
              createdAt: {
                gte: new Date(ts.createdAt.getTime() - 1000), // Within 1 second
                lte: new Date(ts.createdAt.getTime() + 1000),
              },
              note: {
                contains: `${ts.durationHours}h on task`,
              },
            },
          });

          if (!existingExpense && ts.task) {
            // Create new expense
            await tx.expense.create({
              data: {
                organizationId: ts.project.organizationId,
                projectId: ts.projectId,
                userId: userId,
                amount: expenseAmount,
                billable: true,
                status: 'submitted',
                note: `Timesheet hours: ${ts.durationHours}h on task "${ts.task.title}"${ts.notes ? ` - ${ts.notes}` : ''}`,
                submittedAt: ts.createdAt,
              },
            });
          } else if (existingExpense) {
            // Update existing expense amount
            await tx.expense.update({
              where: { id: existingExpense.id },
              data: { amount: expenseAmount },
            });
          }
        }
      }

      return user;
    });

    return successResponse({
      ...updatedUser,
      message: `Hourly rate updated and ${updatedUser ? 'recalculated costs for existing timesheets' : 'no timesheets to update'}`,
    });
  } catch (error) {
    console.error("Error updating hourly rate:", error);
    return errorResponse("Internal server error", 500);
  }
}
