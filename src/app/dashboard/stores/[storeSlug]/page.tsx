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
  ExternalLink,
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
      className="text-xs font-bold text-teal-600 hover:underline inline-flex items-center gap-1"
    >
      {label}
      <ArrowLeft className="h-3 w-3" />
    </Link>
  );
}

async function PendingOrdersBanner({ storeSlug }: { storeSlug: string }) {
  const result = await getAdminOrdersAction(storeSlug, { status: "pending", limit: 1 });
  const pendingCount = result.success ? result.data?.pagination.total ?? 0 : 0;

  if (pendingCount === 0) return null;

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-amber-950 shadow-sm animate-pulse">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-amber-100 p-2">
          <Clock className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-black text-amber-950">
            {pendingCount} {pendingCount === 1 ? "طلب" : "طلبات"} بانتظار المراجعة
          </p>
          <p className="text-xs text-amber-700/80 mt-0.5">
            راجع الطلبات الجديدة بمتجرك وحدّث حالتها
          </p>
        </div>
      </div>
      <Link
        href={`/dashboard/stores/${storeSlug}/orders?status=pending`}
        className="inline-flex h-9 items-center justify-center rounded-xl bg-amber-600 px-4 text-xs font-bold text-white hover:bg-amber-700 transition"
      >
        عرض الطلبات
      </Link>
    </div>
  );
}

async function DashboardStats() {
  const result = await getDashboardStatsAction();

  if (!result.success || !result.data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 text-xs font-bold text-rose-950">
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
      bg: "bg-emerald-500 shadow-emerald-100/50",
      desc: "الإيرادات المحققة بمتجرك",
    },
    {
      title: "إجمالي الطلبات",
      value: stats.totalOrders.toLocaleString("ar-EG"),
      change: stats.ordersGrowth,
      icon: ShoppingCart,
      bg: "bg-amber-500 shadow-amber-100/50",
      desc: "الطلبات المسجلة من عملائك",
    },
    {
      title: "إجمالي المنتجات",
      value: stats.totalProducts.toLocaleString("ar-EG"),
      change: 0,
      icon: Package,
      bg: "bg-indigo-500 shadow-indigo-100/50",
      desc: "المنتجات المضافة بمتجرك",
    },
    {
      title: "إجمالي العملاء",
      value: stats.totalCustomers.toLocaleString("ar-EG"),
      change: stats.customersGrowth,
      icon: Users,
      bg: "bg-rose-500 shadow-rose-100/50",
      desc: "العملاء المسجلين بمتجرك",
    },
  ];

  return (
    <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`rounded-3xl ${card.bg} text-white p-6 shadow-lg relative overflow-hidden group hover:scale-[1.02] transition duration-300`}
        >
          <div className="absolute -right-6 -bottom-6 h-20 w-20 rounded-full bg-white/10" />
          <div className="flex justify-between items-start">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/20 text-white">
              <card.icon className="h-5 w-5" />
            </span>
            {card.change !== 0 && (
              <Badge className="bg-white/20 border-0 hover:bg-white/30 text-white text-[10px] font-bold">
                {card.change > 0 ? "+" : ""}{card.change.toFixed(1)}%
              </Badge>
            )}
          </div>
          <p className="mt-6 text-sm font-bold opacity-80">{card.title}</p>
          <h3 className="text-3xl font-black mt-1">{card.value}</h3>
          <p className="text-[10px] opacity-65 mt-2">{card.desc}</p>
        </div>
      ))}
    </div>
  );
}

async function SalesChartSection() {
  const result = await getSalesDataAction("30d");
  const data = result.data ?? [];

  return <SalesChart data={data} title="نشاط المبيعات والإيرادات (آخر 30 يوماً)" />;
}

async function RecentOrdersSection({ storeSlug }: { storeSlug: string }) {
  const result = await getAdminOrdersAction(storeSlug, { limit: 5 });
  const orders = result.success ? result.data?.orders ?? [] : [];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-slate-950">الطلبات الأخيرة</h3>
          <p className="text-xs text-slate-400 mt-0.5">آخر 5 طلبات مسجلة بمتجرك</p>
        </div>
        <Link
          href={`/dashboard/stores/${storeSlug}/orders`}
          className="text-xs font-bold text-teal-600 hover:underline inline-flex items-center gap-1"
        >
          <span>عرض الكل</span>
          <ArrowLeft className="h-3 w-3" />
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Inbox className="h-10 w-10 text-slate-300 mb-3" />
          <p className="text-sm font-bold text-slate-700">لا توجد طلبات بعد</p>
          <p className="text-xs text-slate-400 mt-1">ستظهر الطلبات الجديدة هنا تلقائياً</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {orders.map((order) => {
            const status = statusLabels[order.status] ?? {
              label: order.status,
              variant: "outline" as const,
            };
            return (
              <Link
                key={order._id}
                href={`/dashboard/stores/${storeSlug}/orders/${order._id}`}
                className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0 hover:bg-slate-50/50 -mx-3 px-3 rounded-2xl transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-900">#{order.orderNumber}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant={status.variant} className="text-[10px] font-bold">
                    {status.label}
                  </Badge>
                  <span className="text-sm font-bold text-slate-800 tabular-nums">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

async function TopProductsSection({ storeSlug }: { storeSlug: string }) {
  const result = await getTopProductsAction(5);
  const products = result.data ?? [];
  const maxSold = products[0]?.soldQuantity ?? 1;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-slate-955">أفضل المنتجات مبيعاً</h3>
          <p className="text-xs text-slate-400 mt-0.5">المنتجات الأكثر طلباً وشعبية</p>
        </div>
        <Link
          href={`/dashboard/stores/${storeSlug}/products`}
          className="text-xs font-bold text-teal-600 hover:underline inline-flex items-center gap-1"
        >
          <span>عرض الكل</span>
          <ArrowLeft className="h-3 w-3" />
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Package className="h-10 w-10 text-slate-300 mb-3" />
          <p className="text-sm font-bold text-slate-700">لا توجد بيانات مبيعات</p>
          <p className="text-xs text-slate-400 mt-1">أضف منتجات وابدأ البيع لرؤية الإحصائيات</p>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product, i) => (
            <div key={product._id} className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-black text-slate-700">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <p className="text-sm font-black text-slate-800 truncate">{product.name}</p>
                  <span className="text-sm font-bold text-slate-955 shrink-0 tabular-nums">
                    {formatCurrency(product.revenue)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-teal-500 transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (product.soldQuantity / maxSold) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {product.soldQuantity.toLocaleString("ar-EG")} وحدة مباعة
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

async function LowStockSection({ storeSlug }: { storeSlug: string }) {
  const result = await getLowStockProductsAction();
  const products = result.data ?? [];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-slate-955 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 animate-pulse" />
            <span>تنبيهات المخزون المنخفض</span>
            {products.length > 0 && (
              <Badge className="bg-amber-100 hover:bg-amber-100 text-amber-700 border-amber-200 font-bold text-xs">
                {products.length}
              </Badge>
            )}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">المنتجات التي اقتربت كميتها من النفاد</p>
        </div>
        {products.length > 0 && (
          <Link
            href={`/dashboard/stores/${storeSlug}/inventory`}
            className="text-xs font-bold text-teal-600 hover:underline"
          >
            إدارة المخزون
          </Link>
        )}
      </div>

      {products.length === 0 ? (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 px-4 py-3 text-emerald-950">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-800">المخزون بحالة ممتازة</p>
            <p className="text-xs text-emerald-600 mt-0.5">جميع المنتجات فوق حد التنبيه الآمن</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.slice(0, 6).map((product) => (
            <div
              key={product._id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/30 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{product.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">SKU: {product.sku}</p>
              </div>
              <Badge
                variant={product.stockQuantity === 0 ? "destructive" : "warning"}
                className="shrink-0 text-[10px] font-bold"
              >
                {product.stockQuantity === 0 ? "نفد" : `${product.stockQuantity} متبقي`}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
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
    <div className="space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-955">لوحة التحكم للمتجر</h1>
          <p className="text-xs text-slate-400 mt-1">
            نظرة عامة على أداء متجرك وإحصائيات البيع — {today}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/${storeSlug}`}
            target="_blank"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition shadow-sm"
          >
            <ExternalLink className="h-4 w-4" />
            <span>معاينة المتجر</span>
          </Link>
          <Link
            href={`/dashboard/stores/${storeSlug}/products/new`}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-slate-900 px-5 text-xs font-bold text-white hover:bg-slate-800 transition"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة منتج جديد</span>
          </Link>
        </div>
      </div>

      {/* Pending orders alert */}
      <Suspense fallback={null}>
        <PendingOrdersBanner storeSlug={storeSlug} />
      </Suspense>

      {/* Stats Grid */}
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats />
      </Suspense>

      {/* Sales Chart Section */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <Suspense
          fallback={
            <div className="space-y-4">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-72 w-full" />
            </div>
          }
        >
          <SalesChartSection />
        </Suspense>
      </div>

      {/* Recent orders & top products grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Suspense fallback={<CardSkeleton height="h-56" />}>
          <RecentOrdersSection storeSlug={storeSlug} />
        </Suspense>

        <Suspense fallback={<CardSkeleton height="h-56" />}>
          <TopProductsSection storeSlug={storeSlug} />
        </Suspense>
      </div>

      {/* Low stock alerts */}
      <Suspense fallback={<CardSkeleton height="h-32" />}>
        <LowStockSection storeSlug={storeSlug} />
      </Suspense>
    </div>
  );
}
