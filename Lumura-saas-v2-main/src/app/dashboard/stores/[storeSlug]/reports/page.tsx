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
} from "@/actions/analytics";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, DollarSign, ShoppingCart, BarChart3 } from "lucide-react";

export const metadata: Metadata = { title: "Reports & Analytics" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ storeSlug: string }>;
  searchParams: Promise<{ period?: string }>;
}

type Period = "7d" | "30d" | "90d" | "1y";

const PERIODS: { value: Period; label: string }[] = [
  { value: "7d",  label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "1y",  label: "This year" },
];

async function SummaryCards({ period }: { period: Period }) {
  const [statsResult, salesResult] = await Promise.all([
    getDashboardStatsAction(),
    getSalesDataAction(period),
  ]);

  const stats = statsResult.data;
  const sales = salesResult.data ?? [];

  const totalRevenue = sales.reduce((s, d) => s + d.revenue, 0);
  const totalOrders  = sales.reduce((s, d) => s + d.orders, 0);
  const totalProfit  = sales.reduce((s, d) => s + d.profit, 0);
  const avgOrder     = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const cards = [
    { title: "Revenue",        value: formatCurrency(totalRevenue), icon: DollarSign,   color: "text-green-600",  bg: "bg-green-100 dark:bg-green-900/20" },
    { title: "Orders",         value: totalOrders.toLocaleString(), icon: ShoppingCart, color: "text-blue-600",   bg: "bg-blue-100 dark:bg-blue-900/20" },
    { title: "Profit",         value: formatCurrency(totalProfit),  icon: TrendingUp,   color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/20" },
    { title: "Avg Order Value",value: formatCurrency(avgOrder),     icon: BarChart3,    color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/20" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
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

async function RevenueChart({ period }: { period: Period }) {
  const result = await getSalesDataAction(period);
  return <SalesChart data={result.data ?? []} />;
}

async function OrdersStatusBreakdown() {
  const result = await getOrdersStatsByStatusAction();
  const stats = result.data ?? [];

  const total = stats.reduce((s, d) => s + d.count, 0);

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Orders by Status</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {stats.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No data</p>
        ) : (
          stats.map((stat) => (
            <div key={stat.status} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize text-xs">{stat.status}</Badge>
                  <span className="text-muted-foreground">{stat.count} orders</span>
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

async function TopProductsTable() {
  const result = await getTopProductsAction(10);
  const products = result.data ?? [];

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Top 10 Products by Revenue</CardTitle></CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">#</th>
                <th className="px-4 py-3 text-left font-medium">Product</th>
                <th className="px-4 py-3 text-right font-medium">Sold</th>
                <th className="px-4 py-3 text-right font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                    No sales data yet
                  </td>
                </tr>
              ) : (
                products.map((p, i) => (
                  <tr key={p._id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground font-mono">#{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{p.soldQuantity}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatCurrency(p.revenue)}</td>
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

export default async function ReportsPage({ params, searchParams }: Props) {
  const { storeSlug } = await params;
  const paramsData = await searchParams;
  const period = (paramsData.period as Period) ?? "30d";

  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Analytics" description="Business performance overview">
        {/* Period selector */}
        <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1">
          {PERIODS.map((p) => (
            <a
              key={p.value}
              href={`/dashboard/stores/${storeSlug}/reports?period=${p.value}`}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                period === p.value
                  ? "bg-background shadow-sm text-foreground"
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
        <SummaryCards period={period} />
      </Suspense>

      {/* Revenue Chart */}
      <Suspense fallback={<Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>}>
        <RevenueChart period={period} />
      </Suspense>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Suspense fallback={<Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>}>
          <OrdersStatusBreakdown />
        </Suspense>
        <Suspense fallback={<Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>}>
          <TopProductsTable />
        </Suspense>
      </div>
    </div>
  );
}
