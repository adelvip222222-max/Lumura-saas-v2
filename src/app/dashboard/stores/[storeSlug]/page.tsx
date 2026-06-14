import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  AlertTriangle,
  Plus,
  ArrowLeft,
  BarChart3,
  Warehouse,
  Clock,
  CheckCircle2,
  Inbox,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getDashboardStatsAction,
  getSalesDataAction,
  getTopProductsAction,
  getLowStockProductsAction,
} from "@/actions/analytics";
import { getAdminOrdersAction } from "@/actions/orders";
import { formatCurrency, formatDate } from "@/lib/utils";
import { SalesChart } from "@/components/admin/sales-chart";
import { auth } from "@/lib/auth";
import {
  getDefaultRedirect,
  getStoreAccessPermissions,
  isStoreManager,
  isStaffRole,
  type TenantRole,
} from "@/lib/auth/permissions";

export const metadata: Metadata = {
  title: "لوحة التحكم | Lumora",
  description: "نظرة عامة على أداء متجرك",
};

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ storeSlug: string }>;
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "warning" }> = {
  pending: { label: "قيد الانتظار", variant: "warning" },
  confirmed: { label: "مؤكد", variant: "secondary" },
  processing: { label: "قيد التجهيز", variant: "secondary" },
  shipped: { label: "تم الشحن", variant: "default" },
  delivered: { label: "تم التوصيل", variant: "default" },
  cancelled: { label: "ملغي", variant: "destructive" },
};

function SectionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
    >
      {label}
      <ArrowLeft className="h-3 w-3" />
    </Link>
  );
}

function QuickActions({ storeSlug }: { storeSlug: string }) {
  const base = `/dashboard/stores/${storeSlug}`;
  const actions = [
    { href: `${base}/products/new`, label: "إضافة منتج", icon: Plus, variant: "primary" as const },
    { href: `${base}/orders`, label: "الطلبات", icon: ShoppingCart, variant: "outline" as const },
    { href: `${base}/inventory`, label: "المخزون", icon: Warehouse, variant: "outline" as const },
    { href: `${base}/reports`, label: "التقارير", icon: BarChart3, variant: "outline" as const },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button key={action.href} variant={action.variant} size="sm" >
          <Link href={action.href}>
            <action.icon className="h-4 w-4 ml-1.5" />
            {action.label}
          </Link>
        </Button>
      ))}
    </div>
  );
}

async function PendingOrdersBanner({ storeSlug }: { storeSlug: string }) {
  const result = await getAdminOrdersAction(storeSlug, { status: "pending", limit: 1 });
  const pendingCount = result.success ? result.data?.pagination.total ?? 0 : 0;

  if (pendingCount === 0) return null;

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900/40">
          <Clock className="h-4 w-4 text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
            {pendingCount} {pendingCount === 1 ? "طلب" : "طلبات"} بانتظار المراجعة
          </p>
          <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
            راجع الطلبات الجديدة وحدّث حالتها
          </p>
        </div>
      </div>
      <Button size="sm" variant="outline" className="shrink-0 border-amber-300" >
        <Link href={`/dashboard/stores/${storeSlug}/orders?status=pending`}>
          عرض الطلبات
        </Link>
      </Button>
    </div>
  );
}

async function DashboardStats() {
  const result = await getDashboardStatsAction();

  if (!result.success || !result.data) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        تعذّر تحميل الإحصائيات. حاول تحديث الصفحة.
      </div>
    );
  }

  const stats = result.data;

  const cards = [
    {
      title: "إجمالي الإيرادات",
      value: formatCurrency(stats.totalRevenue),
      change: stats.revenueGrowth,
      icon: DollarSign,
      accent: "border-l-green-500",
      color: "text-green-600",
      bg: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "إجمالي الطلبات",
      value: stats.totalOrders.toLocaleString("ar-EG"),
      change: stats.ordersGrowth,
      icon: ShoppingCart,
      accent: "border-l-blue-500",
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "إجمالي المنتجات",
      value: stats.totalProducts.toLocaleString("ar-EG"),
      change: 0,
      icon: Package,
      accent: "border-l-purple-500",
      color: "text-purple-600",
      bg: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      title: "إجمالي العملاء",
      value: stats.totalCustomers.toLocaleString("ar-EG"),
      change: stats.customersGrowth,
      icon: Users,
      accent: "border-l-orange-500",
      color: "text-orange-600",
      bg: "bg-orange-100 dark:bg-orange-900/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.title}
          className={`border-l-4 ${card.accent} transition-shadow hover:shadow-md`}
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight">{card.value}</p>
                {card.change !== 0 && (
                  <div className="mt-2 flex items-center gap-1">
                    {card.change > 0 ? (
                      <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        card.change > 0 ? "text-green-600" : "text-destructive"
                      }`}
                    >
                      {Math.abs(card.change).toFixed(1)}% مقارنة بالشهر الماضي
                    </span>
                  </div>
                )}
              </div>
              <div className={`shrink-0 rounded-xl p-2.5 ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function SalesChartSection() {
  const result = await getSalesDataAction("30d");
  const data = result.data ?? [];

  return <SalesChart data={data} title="الإيرادات والطلبات (آخر 30 يوماً)" />;
}

async function RecentOrdersSection({ storeSlug }: { storeSlug: string }) {
  const result = await getAdminOrdersAction(storeSlug, { limit: 5 });
  const orders = result.success ? result.data?.orders ?? [] : [];

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base font-semibold">الطلبات الأخيرة</CardTitle>
        <SectionLink href={`/dashboard/stores/${storeSlug}/orders`} label="عرض الكل" />
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">لا توجد طلبات بعد</p>
            <p className="text-xs text-muted-foreground/80 mt-1">
              ستظهر الطلبات الجديدة هنا تلقائياً
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {orders.map((order) => {
              const status = statusLabels[order.status] ?? {
                label: order.status,
                variant: "outline" as const,
              };
              return (
                <Link
                  key={order._id}
                  href={`/dashboard/stores/${storeSlug}/orders/${order._id}`}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:bg-muted/40 -mx-2 px-2 rounded-md transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      #{order.orderNumber}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={status.variant}>{status.label}</Badge>
                    <span className="text-sm font-semibold tabular-nums">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

async function TopProductsSection({ storeSlug }: { storeSlug: string }) {
  const result = await getTopProductsAction(5);
  const products = result.data ?? [];
  const maxSold = products[0]?.soldQuantity ?? 1;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base font-semibold">أفضل المنتجات مبيعاً</CardTitle>
        <SectionLink href={`/dashboard/stores/${storeSlug}/products`} label="عرض الكل" />
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Package className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">لا توجد بيانات مبيعات</p>
            <p className="text-xs text-muted-foreground/80 mt-1">
              أضف منتجات وابدأ البيع لرؤية الإحصائيات
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product, i) => (
              <div key={product._id} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <span className="text-sm font-semibold shrink-0 tabular-nums">
                      {formatCurrency(product.revenue)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: `${Math.min(100, (product.soldQuantity / maxSold) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {product.soldQuantity.toLocaleString("ar-EG")} وحدة مباعة
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

async function LowStockSection({ storeSlug }: { storeSlug: string }) {
  const result = await getLowStockProductsAction();
  const products = result.data ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          تنبيهات المخزون المنخفض
          {products.length > 0 && (
            <Badge variant="warning">{products.length}</Badge>
          )}
        </CardTitle>
        {products.length > 0 && (
          <SectionLink href={`/dashboard/stores/${storeSlug}/inventory`} label="إدارة المخزون" />
        )}
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg bg-green-50 dark:bg-green-950/20 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                المخزون بحالة جيدة
              </p>
              <p className="text-xs text-green-700/80 dark:text-green-300/80">
                جميع المنتجات فوق حد التنبيه
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {products.slice(0, 6).map((product) => (
              <div
                key={product._id}
                className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                </div>
                <Badge
                  variant={product.stockQuantity === 0 ? "destructive" : "warning"}
                  className="shrink-0"
                >
                  {product.stockQuantity === 0 ? "نفد" : `${product.stockQuantity} متبقي`}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border-l-4 border-l-muted">
          <CardContent className="p-5">
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CardSkeleton({ height = "h-48" }: { height?: string }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-36" />
      </CardHeader>
      <CardContent>
        <Skeleton className={`w-full ${height}`} />
      </CardContent>
    </Card>
  );
}

export default async function AdminDashboardPage({ params }: Props) {
  const { storeSlug } = await params;
  const session = await auth();
  const userRole = session?.user?.role as TenantRole | undefined;

  if (isStaffRole(userRole)) {
    const target = getDefaultRedirect(
      userRole,
      storeSlug,
      getStoreAccessPermissions(session?.user?.stores, storeSlug),
      isStoreManager(session?.user?.stores, storeSlug)
    );
    if (target !== `/dashboard/stores/${storeSlug}`) {
      redirect(target);
    }
  }

  const today = formatDate(new Date());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">لوحة التحكم</h1>
          <p className="text-muted-foreground mt-1">
            نظرة عامة على أداء متجرك — {today}
          </p>
        </div>
        <QuickActions storeSlug={storeSlug} />
      </div>

      {/* Pending orders alert */}
      <Suspense fallback={null}>
        <PendingOrdersBanner storeSlug={storeSlug} />
      </Suspense>

      {/* Stats */}
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats />
      </Suspense>

      {/* Chart */}
      <Suspense
        fallback={
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-72 w-full" />
            </CardContent>
          </Card>
        }
      >
        <SalesChartSection />
      </Suspense>

      {/* Recent orders & top products */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Suspense fallback={<CardSkeleton height="h-56" />}>
          <RecentOrdersSection storeSlug={storeSlug} />
        </Suspense>

        <Suspense fallback={<CardSkeleton height="h-56" />}>
          <TopProductsSection storeSlug={storeSlug} />
        </Suspense>
      </div>

      {/* Low stock */}
      <Suspense fallback={<CardSkeleton height="h-32" />}>
        <LowStockSection storeSlug={storeSlug} />
      </Suspense>
    </div>
  );
}
