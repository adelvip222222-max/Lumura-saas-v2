"use server";

import { connectToDatabase } from "@/lib/db/mongodb";
import Plan from "@/models/Plan";
import { ensureDefaultPlans } from "@/services/subscription.service";
import { serialize } from "@/lib/serialize";
import type { ApiResponse } from "@/types";

export interface PublicPlan {
  _id: string;
  name: string;
  nameAr: string;
  displayName: string;
  description: string;
  price: number;
  yearlyPrice: number;
  currency: string;
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
  isFeatured: boolean;
  sortOrder: number;
  promoLabel?: string;
  promoLabelAr?: string;
}

/** خطط المنصة للصفحة الرئيسية — بدون تسجيل دخول */
export async function getPublicPlansAction(): Promise<ApiResponse<PublicPlan[]>> {
  try {
    await connectToDatabase();
    await ensureDefaultPlans();

    const plans = await Plan.find({ isActive: true })
      .sort({ sortOrder: 1, price: 1 })
      .lean();

    return { success: true, data: serialize(plans) as unknown as PublicPlan[] };
  } catch (error) {
    console.error("getPublicPlansAction:", error);
    return { success: false, error: "تعذر تحميل خطط الأسعار" };
  }
}
