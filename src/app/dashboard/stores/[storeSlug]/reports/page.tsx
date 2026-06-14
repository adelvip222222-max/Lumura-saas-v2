import type { Metadata } from "next";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/page-header";
import { SalesChart } from "@/components/admin/sales-chart";
import {
  getSalesDataAction,
  getTopProductsAction,
  getOrdersStatsByStatusAction,
  getDashboardStatsAction,
  getMostFavoritedProductsAction,
  getLowStockProductsAction,
} from "@/actions/analytics";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, DollarSign, ShoppingCart, BarChart3, Heart, AlertTriangle } from "lucide-react";

export const metadata: Metadata = { title: "التقارير والتحليلات | Lumora" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ storeSlug: string }>;
  searchParams: Promise<{ period?: string }>;
}

type Period = "7d" | "30d" | "90d" | "1y";

const PERIODS: { value: Period; label: string }[] = [
  { value: "7d",  label: "آخر 7 أيام" },
  { value: "30d", label: "آخر 30 يوم" },
  { value: "90d", label: "آخر 90 يوم" },
  { value: "1y",  label: "هذا العام" },
];

async function SummaryCards({ period, storeSlug }: { period: Period; storeSlug: string }) {
  const [statsResult, salesResult] = await Promise.all([
    getDashboardStatsAction(storeSlug),
    getSalesDataAction(period, storeSlug),
  ]);

  const sales = salesResult.data ?? [];

  const totalRevenue = sales.reduce((s, d) => s + d.revenue, 0);
  const totalOrders  = sales.reduce((s, d) => s + d.orders, 0);
  const totalProfit  = sales.reduce((s, d) => s + d.profit, 0);
  const avgOrder     = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const cards = [
    { title: "الإيرادات الإجمالية", value: formatCurrency(totalRevenue), icon: DollarSign,   color: "text-green-600",  bg: "bg-green-100 dark:bg-green-900/20" },
    { title: "إجمالي الطلبات",         value: totalOrders.toLocaleString("ar-EG"), icon: ShoppingCart, color: "text-blue-600",   bg: "bg-blue-100 dark:bg-blue-900/20" },
    { title: "صافي الأرباح المتوقعة",         value: formatCurrency(totalProfit),  icon: TrendingUp,   color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/20" },
    { title: "متوسط قيمة الطلب",value: formatCurrency(avgOrder),     icon: BarChart3,    color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/20" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 text-right rtl">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
              <div className={`rounded-full p-3 ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function RevenueChart({ period, storeSlug }: { period: Period; storeSlug: string }) {
  const result = await getSalesDataAction(period, storeSlug);
  return <SalesChart data={result.data ?? []} />;
}

async function OrdersStatusBreakdown({ storeSlug }: { storeSlug: string }) {
  const result = await getOrdersStatsByStatusAction(storeSlug);
  const stats = result.data ?? [];

  const total = stats.reduce((s, d) => s + d.count, 0);

  return (
    <Card>
      <CardHeader className="text-right"><CardTitle className="text-base font-bold">الطلبات حسب حالتها</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-right rtl">
        {stats.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات للطلبات</p>
        ) : (
          stats.map((stat) => (
            <div key={stat.status} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize text-xs rounded-full">{stat.status}</Badge>
                  <span className="text-muted-foreground">{stat.count} طلب</span>
                </div>
                <span className="font-medium">{formatCurrency(stat.revenue)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: total > 0 ? `${(stat.count / total) * 100}%` : "0%" }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

async function TopProductsTable({ storeSlug }: { storeSlug: string }) {
  const result = await getTopProductsAction(10, storeSlug);
  const products = result.data ?? [];

  return (
    <Card>
      <CardHeader className="text-right"><CardTitle className="text-base font-bold">المنتجات الأكثر شراءً (حسب الإيرادات)</CardTitle></CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right rtl">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium text-right">المنتج</th>
                <th className="px-4 py-3 font-medium text-center">الكمية المباعة</th>
                <th className="px-4 py-3 font-medium text-left">قيمة الإيرادات</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                    لا توجد بيانات مبيعات للمنتجات حتى الآن
                  </td>
                </tr>
              ) : (
                products.map((p, i) => (
                  <tr key={p._id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground font-mono">#{i + 1}</td>
                    <td className="px-4 py-3 font-medium flex items-center gap-2 justify-start">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="h-8 w-8 rounded object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-[10px] font-bold">
                          {p.name.charAt(0)}
                        </div>
                      )}
                      <span>{p.name}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{p.soldQuantity} قطعة</td>
                    <td className="px-4 py-3 text-left font-semibold">{formatCurrency(p.revenue)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

async function MostFavoritedProductsTable({ storeSlug }: { storeSlug: string }) {
  const result = await getMostFavoritedProductsAction(10, storeSlug);
  const products = result.data ?? [];

  return (
    <Card>
      <CardHeader className="text-right">
        <CardTitle className="text-base font-bold flex items-center gap-2 justify-start">
          <Heart className="h-4 w-4 text-red-500 fill-red-500" />
          <span>المنتجات الأكثر إضافة للمفضلة</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right rtl">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium text-right">المنتج</th>
                <th className="px-4 py-3 font-medium text-center">مرات التفضيل</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                    لا توجد منتجات مضافة للمفضلة بعد
                  </td>
                </tr>
              ) : (
                products.map((p, i) => (
                  <tr key={p._id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground font-mono">#{i + 1}</td>
                    <td className="px-4 py-3 font-medium flex items-center gap-2 justify-start">
                      {p.thumbnail ? (
                        <img src={p.thumbnail} alt={p.name} className="h-8 w-8 rounded object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded bg-red-100 flex items-center justify-center text-[10px] font-bold text-red-600">
                          {p.name.charAt(0)}
                        </div>
                      )}
                      <span>{p.name}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-red-600 font-semibold">{p.count} مستخدم</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

async function LowStockProductsTable({ storeSlug }: { storeSlug: string }) {
  const result = await getLowStockProductsAction(10, storeSlug);
  const products = result.data ?? [];

  return (
    <Card className="col-span-full">
      <CardHeader className="text-right">
        <CardTitle className="text-base font-bold flex items-center justify-between">
          <span>تقرير المخزون والمنتجات التي يجب شراؤها (أعد طلبها)</span>
          <Badge variant={products.length > 0 ? "destructive" : "default"} className="rounded-full">
            {products.length > 0 ? `${products.length} تنبيه نقص مخزون` : "حالة المخزون ممتازة"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right rtl">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 font-medium text-right">رمز SKU</th>
                <th className="px-4 py-3 font-medium text-right">المنتج</th>
                <th className="px-4 py-3 font-medium text-center">المخزون المتوفر</th>
                <th className="px-4 py-3 font-medium text-center">حد إعادة الطلب</th>
                <th className="px-4 py-3 font-medium text-center">الإجراء الموصى به</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    جميع المنتجات متوفرة بكميات كافية وتفوق حد إعادة الطلب
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isOut = p.stockQuantity === 0;
                  return (
                    <tr key={p._id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.sku}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                      <td className="px-4 py-3 text-center font-bold text-red-500 tabular-nums">
                        {p.stockQuantity} قطعة
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground tabular-nums">
                        {p.lowStockThreshold} قطعة
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={isOut ? "destructive" : "warning"} className="rounded-full text-[10px]">
                          {isOut ? "نفذ بالكامل (شراء فوري)" : "مخزون حرج (إعادة طلب)"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function ReportsPage({ params, searchParams }: Props) {
  const { storeSlug } = await params;
  const paramsData = await searchParams;
  const period = (paramsData.period as Period) ?? "30d";

  return (
    <div className="space-y-6 text-right rtl">
      <PageHeader title="التقارير والتحليلات للمتجر" description="نظرة عامة على الأداء والمبيعات والمخزون">
        {/* Period selector */}
        <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1 font-medium text-xs">
          {PERIODS.map((p) => (
            <a
              key={p.value}
              href={`/dashboard/stores/${storeSlug}/reports?period=${p.value}`}
              className={`rounded-md px-3 py-1.5 transition-colors ${
                period === p.value
                  ? "bg-background shadow-sm text-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </a>
          ))}
        </div>
      </PageHeader>

      {/* Summary Cards */}
      <Suspense fallback={
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      }>
        <SummaryCards period={period} storeSlug={storeSlug} />
      </Suspense>

      {/* Revenue Chart */}
      <Suspense fallback={<Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>}>
        <RevenueChart period={period} storeSlug={storeSlug} />
      </Suspense>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Suspense fallback={<Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>}>
          <OrdersStatusBreakdown storeSlug={storeSlug} />
        </Suspense>
        
        <Suspense fallback={<Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>}>
          <TopProductsTable storeSlug={storeSlug} />
        </Suspense>

        <Suspense fallback={<Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>}>
          <MostFavoritedProductsTable storeSlug={storeSlug} />
        </Suspense>

        <Suspense fallback={<Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>}>
          <LowStockProductsTable storeSlug={storeSlug} />
        </Suspense>
      </div>
    </div>
  );
}
