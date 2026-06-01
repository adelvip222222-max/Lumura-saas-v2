"use client";

import { useEffect, useState } from "react";
import { getSaaSStatsAction, type SaaSStats } from "@/actions/super-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  Users,
  Store,
  TrendingUp,
  CreditCard,
  AlertCircle,
  Loader2,
} from "lucide-react";

export function StatsOverview() {
  const [stats, setStats] = useState<SaaSStats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSaaSStatsAction().then((res) => {
      if (res.success && res.data) {
        setStats(res.data);
      } else {
        setError(res.error ?? "فشل تحميل الإحصائيات");
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        <AlertCircle className="h-5 w-5" />
        {error || "لا توجد بيانات"}
      </div>
    );
  }

  const cards = [
    { label: "إيراد شهري (MRR)", value: formatCurrency(stats.mrr), icon: TrendingUp },
    { label: "مشتركون نشطون", value: String(stats.activeSubscribers), icon: CreditCard },
    { label: "المتاجر النشطة", value: `${stats.activeStores} / ${stats.totalStores}`, icon: Store },
    { label: "المستخدمون", value: String(stats.totalUsers), icon: Users },
    { label: "إثباتات دفع معلقة", value: String(stats.pendingProofs), icon: AlertCircle },
    { label: "متاجر جديدة هذا الشهر", value: String(stats.newStoresThisMonth), icon: Store },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{card.label}</CardTitle>
              <card.icon className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats.planBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">توزيع الخطط</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.planBreakdown.map((row) => (
                <div
                  key={row.plan}
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2"
                >
                  <span className="font-medium text-gray-800">{row.plan}</span>
                  <span className="text-sm text-gray-600">
                    {row.count} اشتراك — {formatCurrency(row.revenue)}/شهر
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
