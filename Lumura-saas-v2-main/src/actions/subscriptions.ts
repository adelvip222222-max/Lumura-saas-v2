"use server";

import { connectToDatabase } from "@/lib/db/mongodb";
import Subscription from "@/models/Subscription";
import Plan from "@/models/Plan";
import Store from "@/models/Store";
import Notification from "@/models/Notification";
import { auth } from "@/lib/auth";
import { serialize } from "@/lib/serialize";
import {
  getOrCreateStripeCustomer,
  createCheckoutSession,
  createBillingPortalSession,
  cancelSubscription,
  reactivateSubscription,
  updateSubscriptionPlan,
} from "@/services/stripe.service";
import {
  ensureDefaultPlans,
  ensureStoreSubscription,
  assignPlanToStore,
  getUsageStats,
  syncStoreSubscriptionExpiry,
} from "@/services/subscription.service";
import type { ApiResponse } from "@/types";
import type { IPlan } from "@/models/Plan";
import type { ISubscription } from "@/models/Subscription";

// ─── Get all plans ────────────────────────────────────────────────────────────
export async function getPlansAction(): Promise<ApiResponse<IPlan[]>> {
  try {
    await connectToDatabase();
    const plans = await Plan.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
    return { success: true, data: serialize(plans) as unknown as IPlan[] };
  } catch {
    return { success: false, error: "Failed to fetch plans" };
  }
}

// ─── Get current subscription ─────────────────────────────────────────────────
export async function getMySubscriptionAction(
  storeId: string
): Promise<ApiResponse<ISubscription & { planData: IPlan; usageStats: Awaited<ReturnType<typeof getUsageStats>> }>> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Authentication required" };

  try {
    await connectToDatabase();

    const sub = await Subscription.findOne({ storeId })
      .populate<{ planId: IPlan }>("planId")
      .lean();

    if (!sub) return { success: false, error: "Subscription not found" };

    const store = await Store.findById(storeId).select("tenantId").lean();
    if (!store || String(store.tenantId) !== session.user.tenantId) {
      return { success: false, error: "Access denied" };
    }

    const usageStats = await getUsageStats(storeId);

    return {
      success: true,
      data: {
        ...serialize(sub),
        planData: serialize(sub.planId) as unknown as IPlan,
        usageStats,
      } as ISubscription & { planData: IPlan; usageStats: typeof usageStats },
    };
  } catch {
    return { success: false, error: "Failed to fetch subscription" };
  }
}

// ─── Create Stripe checkout session ──────────────────────────────────────────
export async function createStripeCheckoutAction(input: {
  planId:       string;
  storeId:      string;
  billingCycle: "monthly" | "yearly";
}): Promise<ApiResponse<{ url: string }>> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Authentication required" };

  try {
    await connectToDatabase();

    const plan = await Plan.findById(input.planId);
    if (!plan) return { success: false, error: "Plan not found" };

    const priceId =
      input.billingCycle === "yearly"
        ? plan.stripePriceIdYearly
        : plan.stripePriceIdMonthly;

    if (!priceId) {
      return { success: false, error: "Stripe price not configured for this plan" };
    }

    const customerId = await getOrCreateStripeCustomer(
      session.user.id,
      session.user.email!,
      session.user.name ?? "Store Owner"
    );

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const checkoutSession = await createCheckoutSession({
      customerId,
      priceId,
      storeId:    input.storeId,
      userId:     session.user.id,
      successUrl: `${appUrl}/dashboard/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl:  `${appUrl}/dashboard/subscription?canceled=true`,
      trialDays:  plan.name === "free" ? 0 : 7,
    });

    // Update subscription with customer ID
    await Subscription.findOneAndUpdate(
      { storeId: input.storeId },
      { stripeCustomerId: customerId }
    );

    return { success: true, data: { url: checkoutSession.url! } };
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return { success: false, error: "Failed to create checkout session" };
  }
}

// ─── Open Stripe billing portal ───────────────────────────────────────────────
export async function openBillingPortalAction(
  storeId: string
): Promise<ApiResponse<{ url: string }>> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Authentication required" };

  try {
    await connectToDatabase();

    const sub = await Subscription.findOne({ storeId });
    if (!sub?.stripeCustomerId) {
      return { success: false, error: "No Stripe customer found" };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const portal = await createBillingPortalSession(
      sub.stripeCustomerId,
      `${appUrl}/dashboard/subscription`
    );

    return { success: true, data: { url: portal.url } };
  } catch {
    return { success: false, error: "Failed to open billing portal" };
  }
}

// ─── Cancel subscription ──────────────────────────────────────────────────────
export async function cancelSubscriptionAction(
  storeId: string,
  immediately = false
): Promise<ApiResponse> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Authentication required" };

  try {
    await connectToDatabase();

    const sub = await Subscription.findOne({ storeId, userId: session.user.id });
    if (!sub) return { success: false, error: "Subscription not found" };

    if (sub.stripeSubscriptionId) {
      await cancelSubscription(sub.stripeSubscriptionId, immediately);
    }

    if (immediately) {
      await Subscription.findByIdAndUpdate(sub._id, {
        status:     "canceled",
        canceledAt: new Date(),
        autoRenew:  false,
      });
      await Store.findByIdAndUpdate(storeId, {
        isActive: false,
        isSuspended: true,
        suspendedReason: "subscription_canceled",
      });
    } else {
      await Subscription.findByIdAndUpdate(sub._id, { autoRenew: false });
    }

    await Notification.create({
      userId:    session.user.id,
      storeId,
      type:      "subscription_expired",
      title:     immediately ? "Subscription Canceled" : "Subscription Will Cancel",
      titleAr:   immediately ? "تم إلغاء الاشتراك" : "سيتم إلغاء الاشتراك",
      message:   immediately
        ? "Your subscription has been canceled."
        : "Your subscription will cancel at the end of the billing period.",
      messageAr: immediately
        ? "تم إلغاء اشتراكك."
        : "سيتم إلغاء اشتراكك في نهاية فترة الفوترة.",
      link: "/dashboard/subscription",
    });

    return { success: true, message: "Subscription canceled" };
  } catch {
    return { success: false, error: "Failed to cancel subscription" };
  }
}

// ─── Reactivate subscription ──────────────────────────────────────────────────
export async function reactivateSubscriptionAction(
  storeId: string
): Promise<ApiResponse> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Authentication required" };

  try {
    await connectToDatabase();

    const sub = await Subscription.findOne({ storeId, userId: session.user.id });
    if (!sub?.stripeSubscriptionId) {
      return { success: false, error: "No active Stripe subscription" };
    }

    await reactivateSubscription(sub.stripeSubscriptionId);
    await Subscription.findByIdAndUpdate(sub._id, { autoRenew: true });

    return { success: true, message: "Subscription reactivated" };
  } catch {
    return { success: false, error: "Failed to reactivate subscription" };
  }
}

// ─── Upgrade / downgrade plan ─────────────────────────────────────────────────
export async function changePlanAction(input: {
  storeId:      string;
  newPlanId:    string;
  billingCycle: "monthly" | "yearly";
}): Promise<ApiResponse<{ url?: string }>> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Authentication required" };

  try {
    await connectToDatabase();

    const [sub, newPlan] = await Promise.all([
      Subscription.findOne({ storeId: input.storeId, userId: session.user.id }),
      Plan.findById(input.newPlanId),
    ]);

    if (!sub)     return { success: false, error: "Subscription not found" };
    if (!newPlan) return { success: false, error: "Plan not found" };

    const newPriceId =
      input.billingCycle === "yearly"
        ? newPlan.stripePriceIdYearly
        : newPlan.stripePriceIdMonthly;

    if (!newPriceId) {
      return { success: false, error: "Stripe price not configured" };
    }

    // If has active Stripe sub → update it
    if (sub.stripeSubscriptionId) {
      await updateSubscriptionPlan(sub.stripeSubscriptionId, newPriceId);
      await Subscription.findByIdAndUpdate(sub._id, {
        planId:       input.newPlanId,
        billingCycle: input.billingCycle,
        stripePriceId: newPriceId,
      });

      await Notification.create({
        userId:    session.user.id,
        storeId:   input.storeId,
        type:      "upgrade_success",
        title:     "Plan Changed",
        titleAr:   "تم تغيير الخطة",
        message:   `Your plan has been changed to ${newPlan.displayName}.`,
        messageAr: `تم تغيير خطتك إلى ${newPlan.nameAr}.`,
        link:      "/dashboard/subscription",
      });

      return { success: true, message: "Plan updated" };
    }

    // No Stripe sub → create new checkout
    const result = await createStripeCheckoutAction({
      planId:       input.newPlanId,
      storeId:      input.storeId,
      billingCycle: input.billingCycle,
    });

    return result.success
      ? { success: true, data: { url: result.data?.url } }
      : result;
  } catch {
    return { success: false, error: "Failed to change plan" };
  }
}

// ─── Get subscription by store slug (tenant dashboard) ─────────────────────
export async function getStoreSubscriptionBySlugAction(
  storeSlug: string
): Promise<ApiResponse<ISubscription & { planData: IPlan; usageStats: Awaited<ReturnType<typeof getUsageStats>> }>> {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return { success: false, error: "Authentication required" };
  }

  try {
    await connectToDatabase();

    const store = await Store.findOne({
      slug: storeSlug,
      tenantId: session.user.tenantId,
      isDeleted: false,
    });

    if (!store) {
      return { success: false, error: "Store not found" };
    }

    await ensureStoreSubscription(session.user.id, store._id.toString());
    await syncStoreSubscriptionExpiry(store._id.toString());

    return getMySubscriptionAction(store._id.toString());
  } catch (err) {
    console.error("Get store subscription error:", err);
    return { success: false, error: "Failed to fetch subscription" };
  }
}

// ─── Assign plan manually (dev / manual payment) ─────────────────────────────
export async function assignPlanToStoreAction(input: {
  storeSlug: string;
  planId: string;
  billingCycle?: "monthly" | "yearly";
}): Promise<ApiResponse> {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return { success: false, error: "Authentication required" };
  }

  try {
    await connectToDatabase();
    await ensureDefaultPlans();

    const store = await Store.findOne({
      slug: input.storeSlug,
      tenantId: session.user.tenantId,
      isDeleted: false,
    });

    if (!store) {
      return { success: false, error: "Store not found" };
    }

    await ensureStoreSubscription(session.user.id, store._id.toString());

    const updated = await assignPlanToStore(
      store._id.toString(),
      input.planId,
      input.billingCycle ?? "monthly"
    );

    if (!updated) {
      return { success: false, error: "Plan not found" };
    }

    return { success: true, message: "تم تحديث الباقة بنجاح" };
  } catch (err) {
    console.error("Assign plan error:", err);
    return { success: false, error: "Failed to update plan" };
  }
}
