import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { StoreSubscriptionPanel } from "@/components/admin/store-subscription-panel";
import type { PlanData, SubscriptionData } from "@/components/admin/store-subscription-panel";
import { getStoreSubscriptionBySlugAction, getPlansAction } from "@/actions/subscriptions";

export const metadata: Metadata = {
  title: "الاشتراك والباقة | لوحة التحكم",
};

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ storeSlug: string }>;
}

export default async function StoreSubscriptionPage({ params }: Props) {
  const { storeSlug } = await params;

  const [subResult, plansResult] = await Promise.all([
    getStoreSubscriptionBySlugAction(storeSlug),
    getPlansAction(),
  ]);

  if (!subResult.success || !subResult.data) {
    redirect("/dashboard");
  }

  const raw = subResult.data as Record<string, unknown>;
  const planRaw = raw.planData as Record<string, unknown>;

  const subscription: SubscriptionData = {
    _id: String(raw._id),
    status: String(raw.status),
    billingCycle: String(raw.billingCycle ?? "monthly"),
    startDate: String(raw.startDate),
    endDate: String(raw.endDate),
    pricePaid: Number(raw.pricePaid ?? 0),
    currency: String(raw.currency ?? "EGP"),
    planData: {
      _id: String(planRaw._id),
      name: String(planRaw.name),
      nameAr: String(planRaw.nameAr),
      displayName: String(planRaw.displayName),
      description: String(planRaw.description ?? ""),
      price: Number(planRaw.price ?? 0),
      yearlyPrice: Number(planRaw.yearlyPrice ?? 0),
      currency: String(planRaw.currency ?? "EGP"),
      limits: planRaw.limits as PlanData["limits"],
      features: (planRaw.features as string[]) ?? [],
      featuresAr: (planRaw.featuresAr as string[]) ?? [],
      isFeatured: Boolean(planRaw.isFeatured),
    },
    usageStats: raw.usageStats as SubscriptionData["usageStats"],
  };

  const plans: PlanData[] = (plansResult.data ?? []).map((p) => ({
    _id: String(p._id),
    name: p.name,
    nameAr: p.nameAr,
    displayName: p.displayName,
    description: p.description,
    price: p.price,
    yearlyPrice: p.yearlyPrice,
    currency: p.currency,
    limits: p.limits,
    features: p.features ?? [],
    featuresAr: p.featuresAr ?? [],
    isFeatured: p.isFeatured,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="الاشتراك والباقة"
        description="إدارة باقة هذا المتجر ومراقبة الاستخدام — كل متجر له اشتراك مستقل"
      />
      <StoreSubscriptionPanel
        storeSlug={storeSlug}
        subscription={subscription}
        plans={plans}
      />
    </div>
  );
}
