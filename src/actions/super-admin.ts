"use server";

import { connectToDatabase } from "@/lib/db/mongodb";
import Store from "@/models/Store";
import Subscription from "@/models/Subscription";
import Plan from "@/models/Plan";
import User from "@/models/User";
import PaymentProof from "@/models/PaymentProof";
import Tenant from "@/models/Tenant";
import { auth } from "@/lib/auth";
import { serialize } from "@/lib/serialize";
import type { ApiResponse, PaginatedResponse } from "@/types";

export interface SaaSStats {
  // Revenue
  mrr:            number;  // Monthly Recurring Revenue
  arr:            number;  // Annual Recurring Revenue
  totalRevenue:   number;
  revenueGrowth:  number;  // % vs last month
  // Subscribers
  activeSubscribers:  number;
  trialingSubscribers: number;
  canceledThisMonth:  number;
  churnRate:          number;  // %
  // Stores
  totalStores:     number;
  activeStores:    number;
  suspendedStores: number;
  newStoresThisMonth: number;
  // Users
  totalUsers:      number;
  newUsersThisMonth: number;
  // Payments
  pendingProofs:   number;
  // Plan breakdown
  planBreakdown: Array<{ plan: string; count: number; revenue: number }>;
}

export async function getSaaSStatsAction(): Promise<ApiResponse<SaaSStats>> {
  const session = await auth();
  if (!session?.user || !["tenant_admin", "super_admin", "staff_products"].includes(session.user.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  try {
    await connectToDatabase();

    const now            = new Date();
    const startOfMonth   = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      activeSubsRaw,
      trialingSubs,
      canceledThisMonth,
      canceledLastMonth,
      totalStores,
      activeStores,
      suspendedStores,
      newStoresThisMonth,
      totalUsers,
      newUsersThisMonth,
      pendingProofs,
      planBreakdownRaw,
    ] = await Promise.all([
      // Active subscriptions with plan data
      Subscription.find({ status: "active" })
        .populate<{ planId: { price: number; yearlyPrice: number; name: string; displayName: string } }>(
          "planId", "price yearlyPrice name displayName"
        )
        .lean(),
      Subscription.countDocuments({ status: "trialing" }),
      Subscription.countDocuments({
        status:     "canceled",
        canceledAt: { $gte: startOfMonth },
      }),
      Subscription.countDocuments({
        status:     "canceled",
        canceledAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
      }),
      Store.countDocuments({}),
      Store.countDocuments({ isActive: true, isSuspended: false }),
      Store.countDocuments({ isSuspended: true }),
      Store.countDocuments({ createdAt: { $gte: startOfMonth } }),
      User.countDocuments({ role: { $ne: "super_admin" } }),
      User.countDocuments({
        role:      { $ne: "super_admin" },
        createdAt: { $gte: startOfMonth },
      }),
      PaymentProof.countDocuments({ status: "pending" }),
      // Plan breakdown
      Subscription.aggregate([
        { $match: { status: "active" } },
        {
          $lookup: {
            from:         "plans",
            localField:   "planId",
            foreignField: "_id",
            as:           "plan",
          },
        },
        { $unwind: "$plan" },
        {
          $group: {
            _id:     "$plan.name",
            name:    { $first: "$plan.displayName" },
            count:   { $sum: 1 },
            revenue: {
              $sum: {
                $cond: [
                  { $eq: ["$billingCycle", "yearly"] },
                  { $divide: ["$plan.yearlyPrice", 12] },
                  "$plan.price",
                ],
              },
            },
          },
        },
      ]),
    ]);

    // Calculate MRR
    const mrr = activeSubsRaw.reduce((sum, sub) => {
      const plan = sub.planId as { price: number; yearlyPrice: number };
      if (!plan) return sum;
      const monthly =
        sub.billingCycle === "yearly"
          ? plan.yearlyPrice / 12
          : plan.price;
      return sum + monthly;
    }, 0);

    // Last month MRR (simplified — use current active count as proxy)
    const lastMonthActiveSubs = await Subscription.countDocuments({
      status:    "active",
      createdAt: { $lte: endOfLastMonth },
    });
    const avgRevPerSub = activeSubsRaw.length > 0 ? mrr / activeSubsRaw.length : 0;
    const lastMonthMrr = lastMonthActiveSubs * avgRevPerSub;
    const revenueGrowth = lastMonthMrr > 0
      ? ((mrr - lastMonthMrr) / lastMonthMrr) * 100
      : 100;

    // Churn rate = canceled this month / (active last month + canceled this month)
    const baseForChurn = activeSubsRaw.length + canceledThisMonth;
    const churnRate = baseForChurn > 0
      ? (canceledThisMonth / baseForChurn) * 100
      : 0;

    // Total revenue (sum of all paid subscriptions)
    const totalRevenueAgg = await Subscription.aggregate([
      { $match: { status: { $in: ["active", "canceled"] }, pricePaid: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: "$pricePaid" } } },
    ]);
    const totalRevenue = totalRevenueAgg[0]?.total ?? 0;

    return {
      success: true,
      data: {
        mrr:            Math.round(mrr * 100) / 100,
        arr:            Math.round(mrr * 12 * 100) / 100,
        totalRevenue,
        revenueGrowth:  Math.round(revenueGrowth * 10) / 10,
        activeSubscribers:   activeSubsRaw.length,
        trialingSubscribers: trialingSubs,
        canceledThisMonth,
        churnRate:      Math.round(churnRate * 10) / 10,
        totalStores,
        activeStores,
        suspendedStores,
        newStoresThisMonth,
        totalUsers,
        newUsersThisMonth,
        pendingProofs,
        planBreakdown: planBreakdownRaw.map((p) => ({
          plan:    p.name as string,
          count:   p.count as number,
          revenue: Math.round((p.revenue as number) * 100) / 100,
        })),
      },
    };
  } catch (err) {
    console.error("SaaS stats error:", err);
    return { success: false, error: "Failed to fetch SaaS stats" };
  }
}

// ─── ADMIN: Force upgrade subscription ───────────────────────────────────────
export async function adminUpgradeSubscriptionAction(
  subscriptionId: string,
  planId:         string
): Promise<ApiResponse> {
  const session = await auth();
  if (!session?.user || !["tenant_admin", "super_admin", "staff_products"].includes(session.user.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  try {
    await connectToDatabase();

    const plan = await Plan.findById(planId);
    if (!plan) return { success: false, error: "Plan not found" };

    await Subscription.findByIdAndUpdate(subscriptionId, {
      planId,
      status: "active",
    });

    return { success: true, message: `Subscription upgraded to ${plan.displayName}` };
  } catch {
    return { success: false, error: "Failed to upgrade subscription" };
  }
}

// ─── ADMIN: Get revenue over time ─────────────────────────────────────────────
export async function getRevenueTimelineAction(
  months = 12
): Promise<ApiResponse<Array<{ month: string; mrr: number; newSubs: number }>>> {
  const session = await auth();
  if (!session?.user || !["tenant_admin", "super_admin", "staff_products"].includes(session.user.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  try {
    await connectToDatabase();

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const data = await Subscription.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year:  { $year:  "$createdAt" },
            month: { $month: "$createdAt" },
          },
          newSubs: { $sum: 1 },
          revenue: { $sum: "$pricePaid" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const result = data.map((d) => ({
      month:   `${d._id.year}-${String(d._id.month).padStart(2, "0")}`,
      mrr:     Math.round(d.revenue * 100) / 100,
      newSubs: d.newSubs,
    }));

    return { success: true, data: result };
  } catch {
    return { success: false, error: "Failed to fetch revenue timeline" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TENANTS MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

export async function getTenantsAction(
  page = 1,
  limit = 10,
  search = ""
): Promise<ApiResponse<PaginatedResponse<any>>> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "super_admin") {
      return { success: false, error: "Unauthorized" };
    }

    await connectToDatabase();

    const query: Record<string, unknown> = {
      role: { $ne: "super_admin" },
    };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const tenants = await Tenant.find(query)
      .skip(skip)
      .limit(limit)
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    const total = await Tenant.countDocuments(query);

    return {
      success: true,
      data: {
        items: serialize(tenants),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error) {
    console.error("Get tenants error:", error);
    return { success: false, error: "Failed to fetch tenants" };
  }
}

export async function getTenantByIdAction(tenantId: string): Promise<ApiResponse<any>> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "super_admin") {
      return { success: false, error: "Unauthorized" };
    }

    await connectToDatabase();

    const tenant = await Tenant.findById(tenantId).select("-password").lean();

    if (!tenant) {
      return { success: false, error: "Tenant not found" };
    }

    return { success: true, data: serialize(tenant) };
  } catch (error) {
    console.error("Get tenant error:", error);
    return { success: false, error: "Failed to fetch tenant" };
  }
}

export async function updateTenantAction(
  tenantId: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    logo?: string;
    status?: "PENDING" | "ACTIVE" | "SUSPENDED" | "EXPIRED";
    maxStores?: number;
    maxProducts?: number;
    plan?: "MONTHLY" | "SEMI_ANNUAL" | "YEARLY";
    subscriptionEnd?: Date;
  }
): Promise<ApiResponse> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "super_admin") {
      return { success: false, error: "Unauthorized" };
    }

    await connectToDatabase();

    const tenant = await Tenant.findByIdAndUpdate(tenantId, data, {
      new: true,
      runValidators: true,
    });

    if (!tenant) {
      return { success: false, error: "Tenant not found" };
    }

    return {
      success: true,
      message: "Tenant updated successfully",
      data: serialize(tenant),
    };
  } catch (error) {
    console.error("Update tenant error:", error);
    return { success: false, error: "Failed to update tenant" };
  }
}

export async function suspendTenantAction(tenantId: string): Promise<ApiResponse> {
  return updateTenantAction(tenantId, { status: "SUSPENDED" });
}

export async function activateTenantAction(tenantId: string): Promise<ApiResponse> {
  return updateTenantAction(tenantId, { status: "ACTIVE" });
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIPTIONS MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

export async function getSubscriptionsAction(
  page = 1,
  limit = 10,
  status?: string
): Promise<ApiResponse<PaginatedResponse<any>>> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "super_admin") {
      return { success: false, error: "Unauthorized" };
    }

    await connectToDatabase();

    const query: any = {};
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const subscriptions = await Subscription.find(query)
      .skip(skip)
      .limit(limit)
      .populate("userId", "name email")
      .populate("storeId", "name slug")
      .populate("planId", "name price displayName")
      .sort({ createdAt: -1 })
      .lean();

    const total = await Subscription.countDocuments(query);

    return {
      success: true,
      data: {
        items: serialize(subscriptions),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error) {
    console.error("Get subscriptions error:", error);
    return { success: false, error: "Failed to fetch subscriptions" };
  }
}

export async function updateSubscriptionAction(
  subscriptionId: string,
  data: {
    status?: string;
    autoRenew?: boolean;
    pricePaid?: number;
    billingCycle?: "monthly" | "yearly";
    endDate?: Date;
    planId?: string;
  }
): Promise<ApiResponse> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "super_admin") {
      return { success: false, error: "Unauthorized" };
    }

    await connectToDatabase();

    const subscription = await Subscription.findByIdAndUpdate(
      subscriptionId,
      data,
      { new: true, runValidators: true }
    )
      .populate("userId", "name email")
      .populate("storeId", "name slug")
      .populate("planId", "name price displayName");

    if (!subscription) {
      return { success: false, error: "Subscription not found" };
    }

    return {
      success: true,
      message: "Subscription updated successfully",
      data: serialize(subscription),
    };
  } catch (error) {
    console.error("Update subscription error:", error);
    return { success: false, error: "Failed to update subscription" };
  }
}

export async function cancelSubscriptionAction(
  subscriptionId: string
): Promise<ApiResponse> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "super_admin") {
      return { success: false, error: "Unauthorized" };
    }

    await connectToDatabase();

    const subscription = await Subscription.findByIdAndUpdate(
      subscriptionId,
      {
        status: "canceled",
        canceledAt: new Date(),
      },
      { new: true }
    );

    if (!subscription) {
      return { success: false, error: "Subscription not found" };
    }

    return {
      success: true,
      message: "Subscription cancelled successfully",
    };
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return { success: false, error: "Failed to cancel subscription" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PLANS MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

export async function getPlansAction(): Promise<ApiResponse<any[]>> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "super_admin") {
      return { success: false, error: "Unauthorized" };
    }

    await connectToDatabase();
    const { ensureDefaultPlans } = await import("@/services/subscription.service");
    await ensureDefaultPlans();

    const plans = await Plan.find({}).sort({ sortOrder: 1, price: 1 }).lean();

    return {
      success: true,
      data: serialize(plans),
    };
  } catch (error) {
    console.error("Get plans error:", error);
    return { success: false, error: "Failed to fetch plans" };
  }
}

export async function updatePlanAction(
  planId: string,
  data: {
    nameAr?: string;
    displayName?: string;
    description?: string;
    price?: number;
    yearlyPrice?: number;
    currency?: string;
    limits?: {
      products?: number;
      categories?: number;
      brands?: number;
      orders?: number;
      users?: number;
      storage?: number;
    };
    features?: string[];
    featuresAr?: string[];
    isActive?: boolean;
    isFeatured?: boolean;
    sortOrder?: number;
    promoLabel?: string;
    promoLabelAr?: string;
  }
): Promise<ApiResponse> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "super_admin") {
      return { success: false, error: "Unauthorized" };
    }

    await connectToDatabase();

    const plan = await Plan.findByIdAndUpdate(planId, data, {
      new: true,
      runValidators: true,
    });

    if (!plan) {
      return { success: false, error: "Plan not found" };
    }

    return {
      success: true,
      message: "Plan updated successfully",
      data: serialize(plan),
    };
  } catch (error) {
    console.error("Update plan error:", error);
    return { success: false, error: "Failed to update plan" };
  }
}

export async function createPlanAction(data: {
  name: "free" | "basic" | "pro";
  nameAr: string;
  displayName: string;
  description: string;
  price: number;
  yearlyPrice: number;
  currency?: string;
  limits: {
    products: number;
    categories: number;
    brands: number;
    orders: number;
    users: number;
    storage: number;
  };
  features: string[];
  featuresAr: string[];
  isFeatured?: boolean;
  sortOrder?: number;
  promoLabel?: string;
  promoLabelAr?: string;
}): Promise<ApiResponse> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "super_admin") {
      return { success: false, error: "Unauthorized" };
    }

    await connectToDatabase();

    const plan = await Plan.create({
      ...data,
      currency: data.currency ?? "EGP",
      isActive: true,
      isFeatured: data.isFeatured ?? false,
      sortOrder: data.sortOrder ?? 0,
    });

    return {
      success: true,
      message: "Plan created successfully",
      data: serialize(plan),
    };
  } catch (error) {
    console.error("Create plan error:", error);
    return { success: false, error: "Failed to create plan" };
  }
}

export async function deletePlanAction(planId: string): Promise<ApiResponse> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "super_admin") {
      return { success: false, error: "Unauthorized" };
    }

    await connectToDatabase();

    const plan = await Plan.findByIdAndUpdate(
      planId,
      { isActive: false },
      { new: true }
    );

    if (!plan) {
      return { success: false, error: "Plan not found" };
    }

    return {
      success: true,
      message: "Plan deleted successfully",
    };
  } catch (error) {
    console.error("Delete plan error:", error);
    return { success: false, error: "Failed to delete plan" };
  }
}
