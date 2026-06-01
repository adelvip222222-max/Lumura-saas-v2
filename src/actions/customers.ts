"use server";

import { connectToDatabase } from "@/lib/db/mongodb";
import User from "@/models/User";
import { auth } from "@/lib/auth";
import { serialize } from "@/lib/serialize";
import type { ApiResponse, PaginatedResponse } from "@/types";
import { z } from "zod";

export interface CustomerRow {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

const filterSchema = z.object({
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function getCustomersAction(
  rawFilters: unknown
): Promise<ApiResponse<PaginatedResponse<CustomerRow>>> {
  const session = await auth();
  if (!session?.user || !["admin", "super_admin"].includes(session.user.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  const parsed = filterSchema.safeParse(rawFilters);
  if (!parsed.success) {
    return { success: false, error: "Invalid filter parameters" };
  }

  const { search, isActive, page, limit } = parsed.data;

  try {
    await connectToDatabase();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = { role: "user" };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (isActive !== undefined) query.isActive = isActive;

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query)
        .select("name email phone isActive createdAt lastLogin")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    return {
      success: true,
      data: {
        data: serialize(users) as unknown as CustomerRow[],
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      },
    };
  } catch (error) {
    console.error("Get customers error:", error);
    return { success: false, error: "Failed to fetch customers" };
  }
}

export async function toggleCustomerStatusAction(
  userId: string
): Promise<ApiResponse> {
  const session = await auth();
  if (!session?.user || !["admin", "super_admin"].includes(session.user.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  try {
    await connectToDatabase();
    const user = await User.findById(userId);
    if (!user) return { success: false, error: "User not found" };

    user.isActive = !user.isActive;
    await user.save();

    return {
      success: true,
      message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
    };
  } catch (error) {
    console.error("Toggle customer status error:", error);
    return { success: false, error: "Failed to update customer status" };
  }
}
