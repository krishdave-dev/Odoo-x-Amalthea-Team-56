import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { successResponse, errorResponse } from "@/lib/response";

// GET all users with their hourly rates (admin only)
export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return errorResponse("Unauthorized", 401);
    }

    // Only admins can view all hourly rates
    if (currentUser.role !== "admin") {
      return errorResponse("Only admins can view all hourly rates", 403);
    }

    const users = await prisma.user.findMany({
      where: {
        organizationId: currentUser.organizationId,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        hourlyRate: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return successResponse(users);
  } catch (error) {
    console.error("Error fetching users with hourly rates:", error);
    return errorResponse("Internal server error", 500);
  }
}
