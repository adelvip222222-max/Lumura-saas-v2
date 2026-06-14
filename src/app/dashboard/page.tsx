// src/app/dashboard/page.tsx
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import mongoose from "mongoose";
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
  TrendingUp,
  TrendingDown,
  Landmark,
  Users,
} from "lucide-react";
import Subscription from "@/models/Subscription";
import Order from "@/models/Order";
import Product from "@/models/Product";
import {
  syncTenantStoresSubscriptions,
  isSubscriptionActive,
} from "@/services/subscription.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NotificationsBell } from "@/components/ui/notifications-bell";
import { getStoresByTenant } from "@/lib/store/store-actions";
import { connectToDatabase } from "@/lib/db/mongodb";
import Tenant from "@/models/Tenant";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  getDefaultRedirect,
  getStoreAccessPermissions,
  isStoreManager,
  type TenantRole,
} from "@/lib/auth/permissions";
import { SalesReportModal } from "@/components/admin/sales-report-modal";

import "@/models";

export const metadata: Metadata = {
  title: "لوحة التحكم الرئيسية | Lumora",
  description: "نظرة عامة على متاجرك وإحصائياتك المالية والتشغيلية",
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
  financials: {
    inventoryValue: number;
    inventoryCost: number;
    profit: number;
    totalRevenue: number;
    totalSalesCount: number;
  };
}

function storePath(stores: StoreItem[], suffix = ""): string {
  const slug = stores[0]?.slug;
  if (!slug) return "/dashboard/create";
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

  await connectToDatabase();
  if (user.tenantId) {
    await syncTenantStoresSubscriptions(user.tenantId);
  }

  const storesRaw = user.tenantId ? await getStoresByTenant(user.tenantId) : [];
  const storeIds = storesRaw.map((s) => s._id);

  // Load products and orders for all stores to compute financials
  const storeObjectIds = storeIds.map(id => new mongoose.Types.ObjectId(String(id)));
  
  const [allProducts, allOrders] = await Promise.all([
    Product.find({ storeId: { $in: storeObjectIds }, isDeleted: false })
      .select("storeId purchasePrice sellingPrice stockQuantity soldQuantity")
      .lean(),
    Order.find({ storeId: { $in: storeObjectIds }, status: { $nin: ["cancelled", "refunded"] } })
      .select("storeId total items")
      .lean(),
  ]);

  // Create products price map
  const productPriceMap = new Map(allProducts.map(p => [p._id.toString(), p.purchasePrice || 0]));

  // Compute stats per store
  const storeFinancials = new Map<string, {
    inventoryValue: number;
    inventoryCost: number;
    totalRevenue: number;
    totalCost: number;
    profit: number;
    totalSalesCount: number;
  }>();

  // Initialize maps
  for (const storeId of storeIds) {
    storeFinancials.set(String(storeId), {
      inventoryValue: 0,
      inventoryCost: 0,
      totalRevenue: 0,
      totalCost: 0,
      profit: 0,
      totalSalesCount: 0,
    });
  }

  // Aggregate product stock values
  for (const p of allProducts) {
    const sId = String(p.storeId);
    const financials = storeFinancials.get(sId);
    if (financials) {
      financials.inventoryValue += (p.stockQuantity || 0) * (p.sellingPrice || 0);
      financials.inventoryCost += (p.stockQuantity || 0) * (p.purchasePrice || 0);
    }
  }

  // Aggregate orders for revenue and cost
  for (const order of allOrders) {
    const sId = String(order.storeId);
    const financials = storeFinancials.get(sId);
    if (financials) {
      financials.totalRevenue += order.total || 0;
      financials.totalSalesCount += 1;
      for (const item of order.items) {
        const pPrice = productPriceMap.get(item.productId?.toString()) || (item.price * 0.6);
        financials.totalCost += pPrice * (item.quantity || 0);
      }
    }
  }

  // Calculate profit
  for (const [_, financials] of storeFinancials.entries()) {
    financials.profit = financials.totalRevenue - financials.totalCost;
  }

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
    const fin = storeFinancials.get(String(s._id)) ?? {
      inventoryValue: 0,
      inventoryCost: 0,
      profit: 0,
      totalRevenue: 0,
      totalSalesCount: 0,
    };
    return {
      _id: String(s._id),
      slug: s.slug,
      name: s.name,
      logo: s.logo,
      isActive: s.isActive,
      subscriptionExpired: sub?.expired ?? false,
      subscriptionEnd: sub?.endDate ? String(sub.endDate) : undefined,
      statistics: s.statistics,
      financials: fin,
    };
  });

  const tenant: any = user.tenantId
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

  const tenantFinancials = stores.reduce(
    (acc, store) => ({
      totalInventoryValue: acc.totalInventoryValue + store.financials.inventoryValue,
      totalInventoryCost: acc.totalInventoryCost + store.financials.inventoryCost,
      totalProfit: acc.totalProfit + store.financials.profit,
    }),
    { totalInventoryValue: 0, totalInventoryCost: 0, totalProfit: 0 }
  );

  const subscriptionDays = tenant?.subscriptionEnd
    ? daysUntil(new Date(tenant.subscriptionEnd))
    : null;

  const tenantStatus = tenant?.status ? statusLabels[tenant.status] : null;

  // Premium stats cards
  const stats = [
    { 
      title: "إجمالي المتاجر", 
      value: stores.length.toLocaleString("ar-EG"), 
      sub: tenant ? `من ${tenant.maxStores ?? 1} مسموح` : undefined, 
      icon: Store, 
      accent: "border-l-blue-500 hover:border-l-blue-600", 
      color: "text-blue-600 dark:text-blue-400", 
      bg: "bg-blue-50 dark:bg-blue-900/10", 
      href: stores.length ? storePath(stores) : "/dashboard/create" 
    },
    { 
      title: "إجمالي قيمة المخزون", 
      value: formatCurrency(tenantFinancials.totalInventoryValue), 
      sub: `التكلفة المتبقية: ${formatCurrency(tenantFinancials.totalInventoryCost)}`, 
      icon: Landmark, 
      accent: "border-l-purple-500 hover:border-l-purple-600", 
      color: "text-purple-600 dark:text-purple-400", 
      bg: "bg-purple-50 dark:bg-purple-900/10", 
      href: storePath(stores, "/reports") 
    },
    { 
      title: "الطلبات المحققة", 
      value: totals.orders.toLocaleString("ar-EG"), 
      sub: `إجمالي المبيعات: ${formatCurrency(totals.revenue)}`,
      icon: ShoppingBag, 
      accent: "border-l-orange-500 hover:border-l-orange-600", 
      color: "text-orange-600 dark:text-orange-400", 
      bg: "bg-orange-50 dark:bg-orange-900/10", 
      href: storePath(stores, "/orders") 
    },
    { 
      title: "صافي الأرباح المحققة", 
      value: formatCurrency(tenantFinancials.totalProfit), 
      sub: tenantFinancials.totalProfit >= 0 ? "أداء مالي إيجابي" : "عجز مالي", 
      icon: DollarSign, 
      accent: "border-l-green-500 hover:border-l-green-600", 
      color: "text-green-600 dark:text-green-400", 
      bg: "bg-green-50 dark:bg-green-900/10", 
      href: storePath(stores, "/reports") 
    },
  ];

  const quickActions = stores.length
    ? [
        { href: storePath(stores), label: "لوحة المتجر", icon: Store },
        { href: storePath(stores, "/products/new"), label: "إضافة منتج", icon: Plus },
        { href: storePath(stores, "/orders"), label: "الطلبات", icon: ShoppingBag },
        { href: storePath(stores, "/settings"), label: "الإعدادات", icon: Settings },
      ]
    : [{ href: "/dashboard/create", label: "إنشاء متجر", icon: Plus }];

  const today = formatDate(new Date());

  // Store options for the report generator
  const storeOptions = stores.map(s => ({
    _id: s._id,
    name: s.name,
    slug: s.slug
  }));

  return (
    <div className="min-h-screen bg-muted/20 text-right rtl">
      
      {/* Dynamic Background Pattern */}
      <div className="absolute top-0 right-0 left-0 h-64 bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Header */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-muted pb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1 justify-start">
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">لوحة تحكم المنصة</h1>
              {tenantStatus && <Badge variant={tenantStatus.variant} className="rounded-full px-2.5 py-0.5 text-xs font-semibold">{tenantStatus.label}</Badge>}
              {tenant?.plan && <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-xs border-orange-500/20 text-orange-600 dark:text-orange-400 bg-orange-500/5">{planLabels[tenant.plan] ?? tenant.plan}</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">مرحباً بعودتك، <span className="font-semibold text-foreground">{user.name}</span> — {today}</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2.5">
            <NotificationsBell />
            
            {/* Sales PDF Exporter Component */}
            <SalesReportModal stores={storeOptions} />

            {quickActions.map((action) => (
              <Button 
                key={action.href} 
                variant={action.label.includes("إضافة") || action.label.includes("إنشاء") ? "primary" : "outline"} 
                size="sm"
                className="rounded-2xl px-4 py-2 text-sm shadow-sm transition-transform active:scale-95 duration-100"
              >
                <Link href={action.href} className="flex items-center">
                  <action.icon className="h-4 w-4 ml-1.5" /> 
                  <span>{action.label}</span>
                </Link>
              </Button>
            ))}
          </div>
        </div>

        {/* Subscription Alert Banner */}
        {subscriptionDays !== null && subscriptionDays <= 14 && subscriptionDays > 0 && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 backdrop-blur-sm px-5 py-4 dark:border-amber-900/50 dark:bg-amber-950/20">
            <Calendar className="h-5 w-5 text-amber-600 shrink-0 animate-bounce" />
            <p className="text-sm text-amber-900 dark:text-amber-100 font-medium">
              اشتراك المنصة سينتهي خلال <span className="font-bold text-amber-700 dark:text-amber-400">{subscriptionDays}</span>{" "}
              {subscriptionDays === 1 ? "يوم" : "أيام"} —{" "}
              تاريخ الانتهاء المجدد: {tenant?.subscriptionEnd && formatDate(new Date(tenant.subscriptionEnd))}
            </p>
          </div>
        )}

        {/* Parent Financial KPIs Grid */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Link key={stat.title} href={stat.href} className="block group">
              <Card className={`h-full border-l-4 border-muted/80 ${stat.accent} transition-all duration-300 hover:shadow-lg rounded-2xl bg-card/50 backdrop-blur-sm`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-right">
                      <p className="text-xs font-semibold text-muted-foreground tracking-wide">{stat.title}</p>
                      <p className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">{stat.value}</p>
                      {stat.sub && (
                        <p className="mt-1 text-xs text-muted-foreground font-medium">{stat.sub}</p>
                      )}
                    </div>
                    <div className={`shrink-0 rounded-xl p-2.5 ${stat.bg} text-orange-500`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Store performance monitoring table */}
        <Card className="mb-8 rounded-3xl border border-muted/50 shadow-md bg-card/60 backdrop-blur-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-muted">
            <div className="flex items-center gap-2">
              <div className="bg-orange-500/10 p-1.5 rounded-xl">
                <Store className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle className="text-lg font-bold text-foreground">مراقبة أداء المتاجر وتفاصيل الأصول</CardTitle>
            </div>
            <Link
              href="/dashboard/create"
              className="text-xs font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400 inline-flex items-center gap-1.5 hover:underline"
            >
              <span>إضافة متجر جديد</span>
              <Plus className="h-4 w-4" />
            </Link>
          </CardHeader>
          
          <CardContent className="p-0">
            {stores.length > 0 ? (
              <div className="grid gap-5 p-6 sm:grid-cols-1 lg:grid-cols-2">
                {stores.map((store) => {
                  const profitRatio = store.financials.inventoryCost > 0
                    ? Math.round((store.financials.profit / store.financials.inventoryCost) * 100)
                    : 0;

                  return (
                    <div
                      key={store._id}
                      className="group rounded-3xl border border-muted bg-card/30 backdrop-blur-sm p-6 transition-all duration-300 hover:border-orange-500/20 hover:shadow-lg flex flex-col justify-between"
                    >
                      <div>
                        {/* Store Title Bar */}
                        <div className="flex items-start gap-4">
                          {store.logo ? (
                            <img
                              src={store.logo}
                              alt={store.name}
                              className="h-14 w-14 rounded-2xl object-cover shrink-0 border border-muted p-0.5 group-hover:border-orange-500/30 transition-colors"
                            />
                          ) : (
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-sm text-lg font-black text-white">
                              {store.name.charAt(0)}
                            </div>
                          )}
                          
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-extrabold text-md truncate text-foreground group-hover:text-orange-600 transition-colors duration-200">
                                {store.name}
                              </h3>
                              
                              {store.subscriptionExpired ? (
                                <Badge variant="destructive" className="shrink-0 text-[10px] rounded-full px-2">
                                  معلّق — انتهت الباقة
                                </Badge>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
                                  <span className={`h-2 w-2 rounded-full ${store.isActive ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
                                  {store.isActive ? "نشط" : "متوقف"}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">/{store.slug}</p>
                          </div>
                        </div>

                        {/* Operational Stats */}
                        <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs border-b pb-4">
                          <div className="rounded-xl bg-muted/30 py-2 border">
                            <p className="text-[10px] font-bold text-muted-foreground">إجمالي المنتجات</p>
                            <p className="text-sm font-extrabold mt-0.5 text-foreground">
                              {(store.statistics?.totalProducts ?? 0).toLocaleString("ar-EG")}
                            </p>
                          </div>
                          <div className="rounded-xl bg-muted/30 py-2 border">
                            <p className="text-[10px] font-bold text-muted-foreground">إجمالي الطلبات</p>
                            <p className="text-sm font-extrabold mt-0.5 text-foreground">
                              {(store.statistics?.totalOrders ?? 0).toLocaleString("ar-EG")}
                            </p>
                          </div>
                          <div className="rounded-xl bg-muted/30 py-2 border">
                            <p className="text-[10px] font-bold text-muted-foreground">إجمالي العملاء</p>
                            <p className="text-sm font-extrabold mt-0.5 text-foreground">
                              {(store.statistics?.totalCustomers ?? 0).toLocaleString("ar-EG")}
                            </p>
                          </div>
                        </div>

                        {/* Financial Audit Block (الربح والخسارة، قيمة المخزون، التكلفة المتبقية) */}
                        <div className="mt-4 space-y-2.5">
                          <p className="text-xs font-bold text-foreground">الوضع المالي والأصول:</p>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-green-50/50 dark:bg-green-950/10 border border-green-200/50 p-2.5 rounded-xl text-right">
                              <span className="text-[10px] font-bold text-muted-foreground block">قيمة المخزون (سعر البيع)</span>
                              <span className="text-sm font-extrabold text-green-700 dark:text-green-400">
                                {formatCurrency(store.financials.inventoryValue)}
                              </span>
                            </div>
                            <div className="bg-purple-50/50 dark:bg-purple-950/10 border border-purple-200/50 p-2.5 rounded-xl text-right">
                              <span className="text-[10px] font-bold text-muted-foreground block">القيمة المتبقية (سعر الشراء)</span>
                              <span className="text-sm font-extrabold text-purple-700 dark:text-purple-400">
                                {formatCurrency(store.financials.inventoryCost)}
                              </span>
                            </div>
                          </div>

                          {/* Profit Loss Indicator */}
                          <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                            store.financials.profit >= 0 
                              ? "bg-emerald-50/50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/10 dark:border-emerald-900/50 dark:text-emerald-300"
                              : "bg-red-50/50 border-red-200 text-red-800 dark:bg-red-950/10 dark:border-red-900/50 dark:text-red-300"
                          }`}>
                            <div className="flex items-center gap-1.5">
                              {store.financials.profit >= 0 ? (
                                <TrendingUp className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600" />
                              )}
                              <span className="font-bold">قيمة الأرباح والخسائر:</span>
                            </div>
                            <span className="text-sm font-black font-mono">
                              {store.financials.profit >= 0 ? "+" : ""}
                              {formatCurrency(store.financials.profit)}
                            </span>
                          </div>

                        </div>
                      </div>

                      {/* Store Card Buttons */}
                      <div className="mt-6 flex items-center gap-2 pt-4 border-t">
                        {store.subscriptionExpired ? (
                          <Button variant="primary" size="sm" className="flex-1 rounded-xl" >
                            <Link href={`/dashboard/stores/${store.slug}/subscription`} className="flex items-center justify-center">
                              <CreditCard className="h-3.5 w-3.5 ml-1" />
                              تجديد الاشتراك
                            </Link>
                          </Button>
                        ) : (
                          <Button variant="primary" size="sm" className="flex-1 rounded-xl hover:bg-orange-600 text-white font-bold" >
                            <Link href={`/dashboard/stores/${store.slug}`} className="flex items-center justify-center">
                              <ArrowLeft className="h-3.5 w-3.5 ml-1 group-hover:-translate-x-1 transition-transform" />
                              إدارة المتجر
                            </Link>
                          </Button>
                        )}
                        {!store.subscriptionExpired && (
                          <>
                            <Button variant="outline" size="sm" title="تقارير المتجر المالي" className="rounded-xl px-2.5" >
                              <Link href={`/dashboard/stores/${store.slug}/reports`}>
                                <Landmark className="h-4 w-4 text-purple-600" />
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" title="الإعدادات" className="rounded-xl px-2.5" >
                              <Link href={`/dashboard/stores/${store.slug}/settings`}>
                                <Settings className="h-4 w-4 text-muted-foreground" />
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" title="معاينة المتجر" className="rounded-xl px-2.5" >
                              <Link href={`/${store.slug}`} target="_blank">
                                <ExternalLink className="h-4 w-4 text-blue-500" />
                              </Link>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <Store className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <p className="font-semibold text-muted-foreground">لا توجد أي متاجر مسجلة حالياً</p>
                <p className="mt-1 text-sm text-muted-foreground/80 max-w-sm">
                  قم بإنشاء متجرك الأول لتفعيل الحساب المالي والبدء في إضافة المنتجات والطلبات
                </p>
                <Button className="mt-6 rounded-2xl" >
                  <Link href="/dashboard/create" className="flex items-center font-bold">
                    <Plus className="h-4 w-4 ml-1.5" />
                    إنشاء متجر جديد
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Guide Block */}
        <Card className="border-orange-200/50 bg-gradient-to-br from-orange-50/20 to-background dark:from-orange-950/10 rounded-3xl overflow-hidden shadow-sm">
          <CardHeader className="pb-3 border-b border-muted">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground justify-start">
              <Sparkles className="h-4 w-4 text-orange-500" />
              أدوات التشغيل السريع
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  step: "١",
                  title: "أضف منتجاتك للبيع",
                  desc: "ارفع المنتجات وحدد الكميات وسعر البيع والشراء لتقييم المخزون بدقة",
                  href: storePath(stores, "/products/new"),
                },
                {
                  step: "٢",
                  title: "خصص هوية متجرك",
                  desc: "ارفع الشعار وصورة الغلاف وعين الألوان التي تلائم علامتك التجارية",
                  href: storePath(stores, "/settings"),
                },
                {
                  step: "٣",
                  title: "تتبع حالة الطلبات والربحية",
                  desc: "تابع مبيعاتك المكتملة وراجع إحصاءات الربحية لكل متجر ومستوى المنصة",
                  href: storePath(stores, "/orders"),
                },
              ].map((item) => (
                <Link
                  key={item.step}
                  href={item.href}
                  className="group rounded-2xl border bg-background/50 p-5 transition-all hover:border-orange-300 hover:bg-background"
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 text-xs font-bold text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                    {item.step}
                  </span>
                  <p className="mt-3 text-sm font-bold text-foreground group-hover:text-orange-600 transition-colors">{item.title}</p>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
