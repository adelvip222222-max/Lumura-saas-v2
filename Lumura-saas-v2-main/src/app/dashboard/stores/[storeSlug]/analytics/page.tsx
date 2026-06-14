import type { Metadata } from "next";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getSalesDataAction,
  getTopProductsAction,
  getOrdersStatsByStatusAction,
} from "@/actions/analytics";
import { SalesChart } from "@/components/admin/sales-chart";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Analytics" };
export const dynamic = "force-dynamic";

async function OrdersStatusChart() {
  const result = await getOrdersStatsByStatusAction();
  const stats = result.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Orders by Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stats.map((stat) => (
            <div key={stat.status} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {stat.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {stat.count} orders
                </span>
                <span className="font-medium">{formatCurrency(stat.revenue)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

async function TopProductsChart() {
  const result = await getTopProductsAction(10);
  const products = result.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top 10 Products by Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {products.map((product, i) => (
            <div key={product._id} className="flex items-center gap-3">
              <span className="text-sm font-bold text-muted-foreground w-6">
                #{i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{product.name}</p>
                <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{
                      width: `${Math.min(100, (product.soldQuantity / (products[0]?.soldQuantity ?? 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold">{formatCurrency(product.revenue)}</p>
                <p className="text-xs text-muted-foreground">{product.soldQuantity} sold</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

async function SalesChartSection({ period }: { period: "7d" | "30d" | "90d" | "1y" }) {
  const result = await getSalesDataAction(period);
  return <SalesChart data={result.data ?? []} />;
}

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Detailed insights into your business</p>
      </div>

      {/* Sales Chart - 30 days */}
      <Suspense fallback={<Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>}>
        <SalesChartSection period="30d" />
      </Suspense>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Suspense fallback={<Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>}>
          <OrdersStatusChart />
        </Suspense>

        <Suspense fallback={<Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>}>
          <TopProductsChart />
        </Suspense>
      </div>
    </div>
  );
}
