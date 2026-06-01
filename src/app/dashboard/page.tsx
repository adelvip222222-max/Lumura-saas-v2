// src/app/dashboard/page.tsx
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Store,
  Package,
  ShoppingBag,
  DollarSign,
  Settings,
  Plus,
  ArrowLeft,
  Calendar,
  Sparkles,
  ExternalLink,
  CreditCard,
} from "lucide-react";
import Subscription from "@/models/Subscription";
import {
  syncTenantStoresSubscriptions,
  isSubscriptionActive,
} from "@/services/subscription.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStoresByTenant } from "@/lib/store/store-actions";
import { connectToDatabase } from "@/lib/db/mongodb";
import Tenant from "@/models/Tenant";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  getDefaultRedirect,
  getStoreAccessPermissions,
  isStoreManager,
  type TenantRole,
} from "@/lib/auth/permissions"; // استيراد دالة التوجيه

import "@/models";

export const metadata: Metadata = {
  title: "لوحة التحكم | Lumora",
  description: "نظرة عامة على متاجرك وإحصائياتك",
};

export const dynamic = "force-dynamic";

interface StoreItem {
  _id: string;
  slug: string;
  name: string;
  logo?: string;
  isActive: boolean;
  subscriptionExpired: boolean;
  subscriptionEnd?: string;
  statistics?: {
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    totalCustomers: number;
  };
}

function storePath(stores: StoreItem[], suffix = ""): string {
  const slug = stores[0]?.slug;
  if (!slug) return "/dashboard/store/create";
  return `/dashboard/stores/${slug}${suffix}`;
}

function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

const planLabels: Record<string, string> = {
  MONTHLY: "شهري",
  SEMI_ANNUAL: "نصف سنوي",
  YEARLY: "سنوي",
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "warning" | "destructive" }> = {
  ACTIVE: { label: "نشط", variant: "default" },
  PENDING: { label: "قيد المراجعة", variant: "warning" },
  SUSPENDED: { label: "معلق", variant: "destructive" },
  EXPIRED: { label: "منتهي", variant: "destructive" },
};

export default async function DashboardRootPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }



  const user = session.user;
  const userRole = user.role as TenantRole;

  if (userRole === "super_admin") {
    redirect("/super-admin");
  }

  if (userRole !== "tenant_admin") {
    const defaultStoreSlug = user.storeSlug ?? user.stores?.[0]?.slug ?? undefined;
    redirect(
      getDefaultRedirect(
        userRole,
        defaultStoreSlug,
        defaultStoreSlug
          ? getStoreAccessPermissions(user.stores, defaultStoreSlug)
          : user.permissions,
        defaultStoreSlug ? isStoreManager(user.stores, defaultStoreSlug) : false
      )
    );
  }

  if (!user.tenantId) {
    redirect("/unauthorized");
  }

  // ✅ المنطق الخاص بـ tenant_admin فقط
  const storesRaw = user.tenantId ? await getStoresByTenant(user.tenantId) : [];

  await connectToDatabase();
  if (user.tenantId) {
    await syncTenantStoresSubscriptions(user.tenantId);
  }

  const storeIds = storesRaw.map((s) => s._id);
  const subscriptions = storeIds.length
    ? await Subscription.find({ storeId: { $in: storeIds } })
        .select("storeId status endDate")
        .lean()
    : [];

  const subByStoreId = new Map(
    subscriptions.map((sub) => [
      String(sub.storeId),
      {
        expired: !isSubscriptionActive({ status: sub.status, endDate: sub.endDate }),
        endDate: sub.endDate,
      },
    ])
  );

  const stores: StoreItem[] = storesRaw.map((s) => {
    const sub = subByStoreId.get(String(s._id));
    return {
      _id: String(s._id),
      slug: s.slug,
      name: s.name,
      logo: s.logo,
      isActive: s.isActive,
      subscriptionExpired: sub?.expired ?? false,
      subscriptionEnd: sub?.endDate ? String(sub.endDate) : undefined,
      statistics: s.statistics,
    };
  });

  const tenant = user.tenantId
    ? await Tenant.findById(user.tenantId).select("plan status subscriptionEnd maxStores").lean()
    : null;

  const totals = stores.reduce(
    (acc, store) => ({
      products: acc.products + (store.statistics?.totalProducts ?? 0),
      orders: acc.orders + (store.statistics?.totalOrders ?? 0),
      customers: acc.customers + (store.statistics?.totalCustomers ?? 0),
      revenue: acc.revenue + (store.statistics?.totalRevenue ?? 0),
    }),
    { products: 0, orders: 0, customers: 0, revenue: 0 }
  );

  const subscriptionDays = tenant?.subscriptionEnd
    ? daysUntil(new Date(tenant.subscriptionEnd))
    : null;

  const tenantStatus = tenant?.status ? statusLabels[tenant.status] : null;

  const stats = [
    { title: "إجمالي المتاجر", value: stores.length.toLocaleString("ar-EG"), sub: tenant ? `من ${tenant.maxStores ?? 1} مسموح` : undefined, icon: Store, accent: "border-l-blue-500", color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/20", href: stores.length ? storePath(stores) : "/dashboard/store/create" },
    { title: "المنتجات", value: totals.products.toLocaleString("ar-EG"), icon: Package, accent: "border-l-green-500", color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/20", href: storePath(stores, "/products") },
    { title: "الطلبات", value: totals.orders.toLocaleString("ar-EG"), icon: ShoppingBag, accent: "border-l-orange-500", color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/20", href: storePath(stores, "/orders") },
    { title: "الإيرادات", value: formatCurrency(totals.revenue), icon: DollarSign, accent: "border-l-purple-500", color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/20", href: storePath(stores, "/reports") },
  ];

  const quickActions = stores.length
    ? [
        { href: storePath(stores), label: "لوحة المتجر", icon: Store },
        { href: storePath(stores, "/products/new"), label: "إضافة منتج", icon: Plus },
        { href: storePath(stores, "/orders"), label: "الطلبات", icon: ShoppingBag },
        { href: storePath(stores, "/settings"), label: "الإعدادات", icon: Settings },
      ]
    : [{ href: "/dashboard/store/create", label: "إنشاء متجر", icon: Plus }];

  const today = formatDate(new Date());

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold tracking-tight">لوحة التحكم</h1>
              {tenantStatus && <Badge variant={tenantStatus.variant}>{tenantStatus.label}</Badge>}
              {tenant?.plan && <Badge variant="outline">{planLabels[tenant.plan] ?? tenant.plan}</Badge>}
            </div>
            <p className="text-muted-foreground">مرحباً بعودتك، <span className="font-medium text-foreground">{user.name}</span> — {today}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <Button key={action.href} variant={action.label.includes("إضافة") || action.label.includes("إنشاء") ? "primary" : "outline"} size="sm">
                <Link href={action.href} className="flex items-center">
                  <action.icon className="h-4 w-4 ml-1.5" /> {action.label}
                </Link>
              </Button>
            ))}
          </div>
        </div>

        {/* Subscription banner */}
        {subscriptionDays !== null && subscriptionDays <= 14 && subscriptionDays > 0 && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30">
            <Calendar className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-900 dark:text-amber-100">
              اشتراكك ينتهي خلال <strong>{subscriptionDays}</strong>{" "}
              {subscriptionDays === 1 ? "يوم" : "أيام"} —{" "}
              {tenant?.subscriptionEnd && formatDate(new Date(tenant.subscriptionEnd))}
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Link key={stat.title} href={stat.href}>
              <Card className={`h-full border-l-4 ${stat.accent} transition-shadow hover:shadow-md`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="mt-1 text-2xl font-bold tracking-tight">{stat.value}</p>
                      {stat.sub && (
                        <p className="mt-1 text-xs text-muted-foreground">{stat.sub}</p>
                      )}
                    </div>
                    <div className={`shrink-0 rounded-xl p-2.5 ${stat.bg}`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Stores */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold">متاجري</CardTitle>
            <Link
              href="/dashboard/create"
              className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              إضافة متجر
              <Plus className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {stores.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {stores.map((store) => (
                  <div
                    key={store._id}
                    className="group rounded-xl border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      {store.logo ? (
                        <img
                          src={store.logo}
                          alt={store.name}
                          className="h-12 w-12 rounded-xl object-cover shrink-0"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600">
                          <span className="text-lg font-bold text-white">
                            {store.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                            {store.name}
                          </h3>
                          {store.subscriptionExpired ? (
                            <Badge variant="destructive" className="shrink-0 text-[10px]">
                              معلّق — انتهت الباقة
                            </Badge>
                          ) : (
                            <Badge variant={store.isActive ? "default" : "secondary"} className="shrink-0 text-[10px]">
                              {store.isActive ? "نشط" : "متوقف"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">/{store.slug}</p>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-lg bg-muted/50 px-2 py-1.5">
                            <p className="text-xs text-muted-foreground">منتجات</p>
                            <p className="text-sm font-semibold tabular-nums">
                              {(store.statistics?.totalProducts ?? 0).toLocaleString("ar-EG")}
                            </p>
                          </div>
                          <div className="rounded-lg bg-muted/50 px-2 py-1.5">
                            <p className="text-xs text-muted-foreground">طلبات</p>
                            <p className="text-sm font-semibold tabular-nums">
                              {(store.statistics?.totalOrders ?? 0).toLocaleString("ar-EG")}
                            </p>
                          </div>
                          <div className="rounded-lg bg-muted/50 px-2 py-1.5">
                            <p className="text-xs text-muted-foreground">عملاء</p>
                            <p className="text-sm font-semibold tabular-nums">
                              {(store.statistics?.totalCustomers ?? 0).toLocaleString("ar-EG")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 border-t pt-3">
                      {store.subscriptionExpired ? (
                        <Button variant="primary" size="sm" className="flex-1" >
                          <Link href={`/dashboard/stores/${store.slug}/subscription`}>
                            <CreditCard className="h-3.5 w-3.5 ml-1" />
                            تجديد الباقة
                          </Link>
                        </Button>
                      ) : (
                        <Button variant="primary" size="sm" className="flex-1" >
                          <Link href={`/dashboard/stores/${store.slug}`}>
                            <ArrowLeft className="h-3.5 w-3.5 ml-1" />
                            إدارة المتجر
                          </Link>
                        </Button>
                      )}
                      {!store.subscriptionExpired && (
                        <>
                          <Button variant="outline" size="sm" title="الإعدادات" >
                            <Link href={`/dashboard/stores/${store.slug}/settings`}>
                              <Settings className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" title="معاينة المتجر" >
                            <Link href={`/${store.slug}`} target="_blank">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <Store className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="font-medium text-muted-foreground">لا توجد متاجر بعد</p>
                <p className="mt-1 text-sm text-muted-foreground/80 max-w-sm">
                  أنشئ متجرك الأول وابدأ بإضافة المنتجات واستقبال الطلبات
                </p>
                <Button className="mt-6" >
                  <Link href="/dashboard/store/create">
                    <Plus className="h-4 w-4 ml-1.5" />
                    إنشاء متجر جديد
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Getting started */}
        <Card className="border-orange-200/60 bg-gradient-to-br from-orange-50/80 to-background dark:from-orange-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-orange-500" />
              ابدأ بسرعة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "أضف منتجاتك",
                  desc: "ارفع منتجاتك مع الصور والأسعار",
                  href: storePath(stores, "/products/new"),
                },
                {
                  step: "2",
                  title: "خصّص متجرك",
                  desc: "عدّل الشعار والألوان من الإعدادات",
                  href: storePath(stores, "/settings"),
                },
                {
                  step: "3",
                  title: "تابع الطلبات",
                  desc: "راجع الطلبات الجديدة وحدّث حالتها",
                  href: storePath(stores, "/orders"),
                },
              ].map((item) => (
                <Link
                  key={item.step}
                  href={item.href}
                  className="rounded-lg border bg-background/80 p-4 transition-colors hover:border-orange-300 hover:bg-background"
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600">
                    {item.step}
                  </span>
                  <p className="mt-2 text-sm font-medium">{item.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.desc}</p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
