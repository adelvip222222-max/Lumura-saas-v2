"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Crown, Zap, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { assignPlanToStoreAction } from "@/actions/subscriptions";
import { cn } from "@/lib/utils";

export interface PlanData {
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
  isFeatured?: boolean;
}

export interface SubscriptionData {
  _id: string;
  status: string;
  billingCycle: string;
  startDate: string;
  endDate: string;
  pricePaid: number;
  currency: string;
  planData: PlanData;
  usageStats: {
    products: number;
    categories: number;
    brands: number;
    orders: number;
    users: number;
  };
}

const statusLabels: Record<string, { ar: string; variant: "default" | "warning" | "destructive" | "secondary" }> = {
  trialing: { ar: "تجريبي", variant: "secondary" },
  active: { ar: "نشط", variant: "default" },
  past_due: { ar: "متأخر", variant: "warning" },
  canceled: { ar: "ملغي", variant: "destructive" },
  unpaid: { ar: "غير مدفوع", variant: "destructive" },
  paused: { ar: "موقوف", variant: "warning" },
};

const planIcons: Record<string, typeof Sparkles> = {
  free: Sparkles,
  basic: Zap,
  pro: Crown,
};

interface Props {
  storeSlug: string;
  subscription: SubscriptionData;
  plans: PlanData[];
}

function formatLimit(value: number): string {
  return value === -1 ? "∞" : value.toLocaleString("ar-EG");
}

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit === -1 ? 15 : Math.min(100, (used / Math.max(limit, 1)) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {used.toLocaleString("ar-EG")} / {formatLimit(limit)}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", pct >= 90 ? "bg-destructive" : "bg-primary")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function StoreSubscriptionPanel({ storeSlug, subscription, plans }: Props) {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    (subscription.billingCycle as "monthly" | "yearly") ?? "monthly"
  );

  const currentPlanId = subscription.planData._id;
  const status = statusLabels[subscription.status] ?? { ar: subscription.status, variant: "secondary" as const };
  const endDate = new Date(subscription.endDate);
  const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isExpired = daysLeft <= 0 || ["paused", "unpaid", "canceled"].includes(subscription.status);

  const handleSelectPlan = async (planId: string) => {
    if (planId === currentPlanId && !isExpired) return;
    setLoadingPlan(planId);
    try {
      const result = await assignPlanToStoreAction({ storeSlug, planId, billingCycle });
      if (!result.success) {
        toast.error(result.error ?? "فشل تغيير الباقة");
        return;
      }
      toast.success("تم تحديث الباقة بنجاح");
      router.refresh();
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="space-y-6">
      {isExpired && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="font-semibold text-destructive">انتهت باقة هذا المتجر</p>
          <p className="mt-1 text-muted-foreground">
            المتجر معلّق ولا يظهر للزوار. اختر باقة أدناه لتجديد الاشتراك وإعادة تفعيل المتجر.
          </p>
        </div>
      )}

      {/* Current subscription */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base">اشتراك هذا المتجر</CardTitle>
            <Badge variant={status.variant}>{status.ar}</Badge>
          </div>
          <CardDescription>
            كل متجر له باقة واشتراك مستقل — لا يتشارك مع متاجر أخرى
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">الباقة الحالية</p>
              <p className="font-semibold">{subscription.planData.nameAr}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">دورة الفوترة</p>
              <p className="font-semibold">{billingCycle === "yearly" ? "سنوي" : "شهري"}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">ينتهي في</p>
              <p className="font-semibold">{endDate.toLocaleDateString("ar-EG")}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">الأيام المتبقية</p>
              <p className={cn("font-semibold", daysLeft <= 7 && "text-destructive")}>
                {daysLeft > 0 ? `${daysLeft} يوم` : "منتهي"}
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <p className="text-sm font-medium">استخدام الباقة</p>
            <UsageBar label="المنتجات" used={subscription.usageStats.products} limit={subscription.planData.limits.products} />
            <UsageBar label="الفئات" used={subscription.usageStats.categories} limit={subscription.planData.limits.categories} />
            <UsageBar label="الطلبات" used={subscription.usageStats.orders} limit={subscription.planData.limits.orders} />
          </div>
        </CardContent>
      </Card>

      {/* Billing cycle toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant={billingCycle === "monthly" ? "primary" : "outline"}
          size="sm"
          onClick={() => setBillingCycle("monthly")}
        >
          شهري
        </Button>
        <Button
          variant={billingCycle === "yearly" ? "primary" : "outline"}
          size="sm"
          onClick={() => setBillingCycle("yearly")}
        >
          سنوي (وفّر 15%)
        </Button>
      </div>

      {/* Plans grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const Icon = planIcons[plan.name] ?? Sparkles;
          const isCurrent = plan._id === currentPlanId;
          const price = billingCycle === "yearly" ? plan.yearlyPrice : plan.price;

          return (
            <Card
              key={plan._id}
              className={cn(
                "relative transition-shadow",
                isCurrent && "border-primary shadow-md",
                plan.isFeatured && !isCurrent && "border-orange-300"
              )}
            >
              {plan.isFeatured && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-orange-500 px-3 py-0.5 text-xs font-medium text-white">
                  الأكثر شعبية
                </span>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{plan.nameAr}</CardTitle>
                    <CardDescription className="text-xs">{plan.displayName}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-3xl font-bold">{price.toLocaleString("ar-EG")}</span>
                  <span className="text-sm text-muted-foreground mr-1">
                    {plan.currency} / {billingCycle === "yearly" ? "سنة" : "شهر"}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {(plan.featuresAr ?? plan.features).slice(0, 4).map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={isCurrent ? "outline" : "primary"}
                  disabled={(isCurrent && !isExpired) || loadingPlan === plan._id}
                  loading={loadingPlan === plan._id}
                  onClick={() => handleSelectPlan(plan._id)}
                >
                  {isCurrent && !isExpired
                    ? "الباقة الحالية"
                    : isExpired
                      ? "تجديد بهذه الباقة"
                      : "اختيار هذه الباقة"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
