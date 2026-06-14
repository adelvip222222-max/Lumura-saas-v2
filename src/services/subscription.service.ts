import { connectToDatabase } from "@/lib/db/mongodb";
import Plan from "@/models/Plan";
import Subscription from "@/models/Subscription";
import Store from "@/models/Store";
import Product from "@/models/Product";
import Category from "@/models/Category";
import Brand from "@/models/Brand";
import Order from "@/models/Order";
import type { IPlanLimits } from "@/models/Plan";
import type { ISubscription, SubscriptionStatus } from "@/models/Subscription";
import mongoose from "mongoose";

export interface StoreSubscriptionState {
  storeId: string;
  isExpired: boolean;
  isActive: boolean;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  daysLeft: number;
}

interface DefaultPlanSeed {
  name: "free" | "basic" | "pro";
  nameAr: string;
  displayName: string;
  description: string;
  price: number;
  yearlyPrice: number;
  currency: string;
  limits: IPlanLimits;
  features: string[];
  featuresAr: string[];
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
}

const DEFAULT_PLANS: DefaultPlanSeed[] = [
  {
    name: "free",
    nameAr: "تجربة مجانية",
    displayName: "Free Trial",
    description: "Perfect to test the platform",
    price: 0,
    yearlyPrice: 0,
    currency: "EGP",
    limits: { products: 50, categories: 5, brands: 5, orders: 100, users: 2, storage: 200 },
    features: ["50 products", "Basic analytics", "30-day free trial"],
    featuresAr: ["50 منتج", "تحليلات أساسية", "تجربة مجانية 30 يوم (شهر مجاناً)"],
    isActive: true,
    isFeatured: false,
    sortOrder: 0,
  },
  {
    name: "basic",
    nameAr: "الخطة الأساسية",
    displayName: "Basic Plan",
    description: "For growing stores and small business owners",
    price: 100,
    yearlyPrice: 1000,
    currency: "EGP",
    limits: { products: 500, categories: 20, brands: 20, orders: 1000, users: 5, storage: 2000 },
    features: ["500 products", "Store reports", "Email support", "Custom domain support"],
    featuresAr: ["500 منتج", "تقارير المتجر", "دعم بالبريد", "ربط دومين خاص"],
    isActive: true,
    isFeatured: true,
    sortOrder: 1,
  },
  {
    name: "pro",
    nameAr: "الخطة الاحترافية",
    displayName: "Pro Plan",
    description: "Unlimited power for high-volume stores",
    price: 250,
    yearlyPrice: 2500,
    currency: "EGP",
    limits: { products: -1, categories: -1, brands: -1, orders: -1, users: 20, storage: -1 },
    features: ["Unlimited products", "Priority 24/7 support", "Advanced sales analytics", "Unlimited staff"],
    featuresAr: ["منتجات غير محدودة", "دعم فني ذو أولوية 24/7", "تحليلات مبيعات متقدمة", "موظفين غير محدودين"],
    isActive: true,
    isFeatured: false,
    sortOrder: 2,
  },
];

export async function ensureDefaultPlans(): Promise<void> {
  await connectToDatabase();
  for (const plan of DEFAULT_PLANS) {
    await Plan.findOneAndUpdate(
      { name: plan.name },
      { $set: plan },
      { upsert: true, new: true }
    );
  }

  // إضافة الحقول الناقصة للخطط القديمة في MongoDB
  await Plan.updateMany(
    { isFeatured: { $exists: false } },
    { $set: { isFeatured: false } }
  );
  await Plan.updateMany(
    { isActive: { $exists: false } },
    { $set: { isActive: true } }
  );
  await Plan.updateMany(
    { sortOrder: { $exists: false } },
    { $set: { sortOrder: 0 } }
  );
}

export async function getUsageStats(storeId: string) {
  await connectToDatabase();
  const oid = new mongoose.Types.ObjectId(storeId);
  const store = await Store.findById(oid).select("tenantId").lean();
  if (!store) {
    return { products: 0, categories: 0, brands: 0, orders: 0, users: 0 };
  }

  const [products, categories, brands, orders] = await Promise.all([
    Product.countDocuments({ storeId: oid, isDeleted: false }),
    Category.countDocuments({ storeId: oid, isDeleted: false }),
    Brand.countDocuments({ storeId: oid, isDeleted: false }),
    Order.countDocuments({ storeId: oid }),
  ]);

  return { products, categories, brands, orders, users: 0 };
}

export async function createStoreSubscription(params: {
  userId: string;
  storeId: string;
  planName?: "free" | "basic" | "pro";
  trialDays?: number;
}): Promise<ISubscription> {
  await connectToDatabase();
  await ensureDefaultPlans();

  const existing = await Subscription.findOne({ storeId: params.storeId });
  if (existing) return existing;

  const plan = await Plan.findOne({ name: params.planName ?? "free", isActive: true });
  if (!plan) throw new Error("Default plan not found");

  const startDate = new Date();
  const trialDays = params.trialDays ?? 14;
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + trialDays);

  return Subscription.create({
    userId: new mongoose.Types.ObjectId(params.userId),
    storeId: new mongoose.Types.ObjectId(params.storeId),
    planId: plan._id,
    status: "trialing",
    billingCycle: "monthly",
    paymentMethod: "manual",
    startDate,
    endDate,
    trialEndDate: endDate,
    autoRenew: true,
    pricePaid: 0,
    currency: plan.currency,
    currentUsage: { products: 0, categories: 0, brands: 0, orders: 0, users: 0 },
  });
}

export async function ensureStoreSubscription(
  userId: string,
  storeId: string
): Promise<ISubscription> {
  await connectToDatabase();
  const existing = await Subscription.findOne({ storeId });
  if (existing) return existing;
  return createStoreSubscription({ userId, storeId });
}

export function isSubscriptionActive(sub: Pick<ISubscription, "status" | "endDate">): boolean {
  const end = new Date(sub.endDate);
  if (Number.isNaN(end.getTime())) return false;
  if (end <= new Date()) return false;
  return ["active", "trialing"].includes(sub.status);
}

function daysUntilEnd(endDate: Date): number {
  return Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

/** يعلّق المتجر ويوقف الاشتراك عند تجاوز endDate */
export async function syncStoreSubscriptionExpiry(storeId: string): Promise<StoreSubscriptionState | null> {
  await connectToDatabase();
  const oid = new mongoose.Types.ObjectId(storeId);

  const [sub, store] = await Promise.all([
    Subscription.findOne({ storeId: oid }),
    Store.findById(oid).select("isActive isSuspended").lean(),
  ]);

  if (!sub || !store) return null;

  const now = new Date();
  const endDate = new Date(sub.endDate);
  const expiredByDate = endDate <= now;
  const activeStatuses: SubscriptionStatus[] = ["active", "trialing"];

  if (expiredByDate && activeStatuses.includes(sub.status)) {
    await Promise.all([
      Subscription.findByIdAndUpdate(sub._id, { status: "paused" }),
      Store.findByIdAndUpdate(oid, { isActive: false, isSuspended: true, suspendedReason: "subscription_expired" }),
    ]);
    sub.status = "paused";
  }

  const subscriptionValid = isSubscriptionActive({
    status: sub.status,
    endDate: sub.endDate,
  });

  if (subscriptionValid && (!store.isActive || store.isSuspended)) {
    await Store.findByIdAndUpdate(oid, {
      $set: { isActive: true, isSuspended: false },
      $unset: { suspendedReason: "" },
    });
  }

  return {
    storeId,
    isExpired: !subscriptionValid,
    isActive: subscriptionValid,
    status: sub.status,
    startDate: sub.startDate,
    endDate: sub.endDate,
    daysLeft: daysUntilEnd(endDate),
  };
}

export async function syncStoreSubscriptionBySlug(storeSlug: string): Promise<StoreSubscriptionState | null> {
  await connectToDatabase();
  const store = await Store.findOne({ slug: storeSlug, isDeleted: false }).select("_id").lean();
  if (!store) return null;
  return syncStoreSubscriptionExpiry(store._id.toString());
}

export async function syncTenantStoresSubscriptions(tenantId: string): Promise<StoreSubscriptionState[]> {
  await connectToDatabase();
  const stores = await Store.find({
    tenantId: new mongoose.Types.ObjectId(tenantId),
    isDeleted: false,
  })
    .select("_id")
    .lean();

  const results = await Promise.all(stores.map((s) => syncStoreSubscriptionExpiry(s._id.toString())));
  return results.filter((r): r is StoreSubscriptionState => r !== null);
}

export async function assignPlanToStore(
  storeId: string,
  planId: string,
  billingCycle: "monthly" | "yearly" = "monthly"
): Promise<ISubscription | null> {
  await connectToDatabase();
  const plan = await Plan.findById(planId);
  if (!plan) return null;

  const startDate = new Date();
  const endDate = new Date();
  if (billingCycle === "yearly") {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  const pricePaid = billingCycle === "yearly" ? plan.yearlyPrice : plan.price;

  const updated = await Subscription.findOneAndUpdate(
    { storeId },
    {
      planId: plan._id,
      status: plan.name === "free" ? "trialing" : "active",
      billingCycle,
      startDate,
      endDate,
      pricePaid,
      currency: plan.currency,
      autoRenew: true,
    },
    { new: true, upsert: false }
  );

  if (updated) {
    await Store.findByIdAndUpdate(storeId, {
      $set: { isActive: true, isSuspended: false },
      $unset: { suspendedReason: "" },
    });
  }

  return updated;
}
