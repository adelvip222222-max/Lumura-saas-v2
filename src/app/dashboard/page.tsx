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
  LayoutDashboard,
  Search,
  BarChart3,
  LogOut,
  Globe2,
} from "lucide-react";
import Subscription from "@/models/Subscription";
import {
  syncTenantStoresSubscriptions,
  isSubscriptionActive,
} from "@/services/subscription.service";
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
} from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";

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

  const subByStoreId = new Map<string, { expired: boolean; endDate?: any }>(
    subscriptions.map((sub) => [
      String(sub.storeId),
      {
        expired: !isSubscriptionActive({ status: sub.status as any, endDate: sub.endDate as any }),
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

  const tenant = (user.tenantId
    ? await Tenant.findById(user.tenantId).select("plan status subscriptionEnd maxStores").lean()
    : null) as { plan: string; status: string; subscriptionEnd?: string | Date; maxStores?: number; } | null;

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
  const today = formatDate(new Date());

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-800" dir="rtl">
      {/* 1. Left Sidebar (RTL layout: shows on the right side of the screen visually but behaves as sidebar) */}
      <aside className="hidden w-64 shrink-0 bg-slate-950 text-slate-300 p-6 flex flex-col justify-between border-l border-slate-900 md:flex">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-3 border-b border-slate-900 pb-5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-600 text-white font-black">
              L
            </span>
            <span className="text-lg font-black text-white tracking-wide">LUMURA</span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900 text-white font-bold transition">
              <LayoutDashboard className="h-5 w-5 text-teal-500" />
              <span>الرئيسية</span>
            </Link>
            <Link href={stores.length ? storePath(stores) : "/dashboard/create"} className="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:bg-slate-900 hover:text-white transition font-semibold">
              <Store className="h-5 w-5 text-slate-500" />
              <span>متاجر البيع</span>
            </Link>
            <Link href={storePath(stores, "/products")} className="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:bg-slate-900 hover:text-white transition font-semibold">
              <Package className="h-5 w-5 text-slate-500" />
              <span>إدارة المنتجات</span>
            </Link>
            <Link href={storePath(stores, "/orders")} className="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:bg-slate-900 hover:text-white transition font-semibold">
              <ShoppingBag className="h-5 w-5 text-slate-500" />
              <span>الطلبات والمبيعات</span>
            </Link>
            <Link href={storePath(stores, "/reports")} className="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:bg-slate-900 hover:text-white transition font-semibold">
              <BarChart3 className="h-5 w-5 text-slate-500" />
              <span>تحليلات المتجر</span>
            </Link>
            <Link href={storePath(stores, "/settings")} className="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:bg-slate-900 hover:text-white transition font-semibold">
              <Settings className="h-5 w-5 text-slate-500" />
              <span>الإعدادات العامة</span>
            </Link>
          </nav>
        </div>

        {/* Sidebar Bottom - Limits / Usage */}
        {tenant && (
          <div className="border-t border-slate-900 pt-5 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400">
              <span>المتاجر النشطة</span>
              <span>{stores.length} / {tenant.maxStores ?? 5}</span>
            </div>
            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((stores.length / (tenant.maxStores ?? 5)) * 100, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>الباقة: {planLabels[tenant.plan] || tenant.plan}</span>
              {tenantStatus && <span className="text-teal-500">{tenantStatus.label}</span>}
            </div>
          </div>
        )}
      </aside>

      {/* 2. Main Layout (Center + Right) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto lg:flex-row">
        {/* Center Content Area */}
        <main className="flex-1 p-6 md:p-8 space-y-8 min-w-0">
          {/* Header */}
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input Mock */}
            <div className="flex h-11 w-full max-w-md items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث عن المتاجر، المنتجات، الإحصائيات..."
                className="w-full text-xs bg-transparent outline-none text-slate-800"
                disabled
              />
            </div>
            {/* Profile Info & Logout */}
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div className="flex items-center gap-2 rounded-2xl bg-white border border-slate-200 px-3 py-1.5 shadow-sm">
                <Globe2 className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-700">العربية</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center font-bold text-teal-700 shadow-sm">
                  {user.name?.charAt(0) || "U"}
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-black text-slate-900 leading-3">{user.name}</p>
                  <p className="text-[10px] text-slate-400 mt-1">مدير حساب</p>
                </div>
              </div>
            </div>
          </header>

          {/* Welcome Banner Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-500 to-cyan-600 p-8 text-white shadow-lg shadow-teal-100/50">
            <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="relative max-w-md space-y-2">
              <Badge className="bg-white/20 text-white border-0 hover:bg-white/20">منصة إدارة التجارة الإلكترونية</Badge>
              <h2 className="text-3xl font-black">مرحباً بعودتك، {user.name}!</h2>
              <p className="text-sm text-teal-50/80 leading-relaxed">
                لديك تحليلات إحصائية كاملة ومبيعات محدثة لجميع متاجرك اليوم. ألقِ نظرة على الأداء والتقارير العامة.
              </p>
            </div>
          </div>

          {/* Subscription days warning if any */}
          {subscriptionDays !== null && subscriptionDays <= 14 && subscriptionDays > 0 && (
            <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-amber-950 shadow-sm">
              <Calendar className="h-5 w-5 text-amber-600 shrink-0" />
              <p className="text-xs font-bold leading-relaxed">
                اشتراكك في المنصة ينتهي خلال <strong className="text-amber-700">{subscriptionDays} أيام</strong> ({tenant?.subscriptionEnd && formatDate(new Date(tenant.subscriptionEnd))}). يرجى تجديد الاشتراك لضمان استمرارية عمل متاجرك.
              </p>
            </div>
          )}

          {/* Color-coded Cards Grid (like Mockup) */}
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {/* Store card - Red */}
            <div className="rounded-3xl bg-rose-500 text-white p-6 shadow-lg shadow-rose-100/50 relative overflow-hidden group hover:scale-[1.02] transition duration-300">
              <div className="absolute -right-6 -bottom-6 h-20 w-20 rounded-full bg-white/10" />
              <div className="flex justify-between items-start">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/20 text-white">
                  <Store className="h-5 w-5" />
                </span>
                <Badge className="bg-white/20 border-0 hover:bg-white/30 text-white text-[10px]">
                  {tenant ? `الحد الأقصى: ${tenant.maxStores}` : ""}
                </Badge>
              </div>
              <p className="mt-6 text-sm font-bold opacity-80">إجمالي المتاجر</p>
              <h3 className="text-3xl font-black mt-1">{stores.length}</h3>
              <p className="text-[10px] opacity-65 mt-2">
                {stores.length ? "متاجر نشطة ومعدة بالكامل" : "ابدأ بإنشاء متجر جديد"}
              </p>
            </div>

            {/* Products card - Purple */}
            <div className="rounded-3xl bg-indigo-500 text-white p-6 shadow-lg shadow-indigo-100/50 relative overflow-hidden group hover:scale-[1.02] transition duration-300">
              <div className="absolute -right-6 -bottom-6 h-20 w-20 rounded-full bg-white/10" />
              <div className="flex justify-between items-start">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/20 text-white">
                  <Package className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-6 text-sm font-bold opacity-80">المنتجات الكلية</p>
              <h3 className="text-3xl font-black mt-1">{totals.products}</h3>
              <p className="text-[10px] opacity-65 mt-2">عبر كافة فئات ومخازن المتاجر</p>
            </div>

            {/* Orders card - Orange */}
            <div className="rounded-3xl bg-amber-500 text-white p-6 shadow-lg shadow-amber-100/50 relative overflow-hidden group hover:scale-[1.02] transition duration-300">
              <div className="absolute -right-6 -bottom-6 h-20 w-20 rounded-full bg-white/10" />
              <div className="flex justify-between items-start">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/20 text-white">
                  <ShoppingBag className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-6 text-sm font-bold opacity-80">إجمالي طلبات البيع</p>
              <h3 className="text-3xl font-black mt-1">{totals.orders}</h3>
              <p className="text-[10px] opacity-65 mt-2">الطلبات المسجلة من عملائك</p>
            </div>

            {/* Revenue card - Green/Emerald */}
            <div className="rounded-3xl bg-emerald-500 text-white p-6 shadow-lg shadow-emerald-100/50 relative overflow-hidden group hover:scale-[1.02] transition duration-300">
              <div className="absolute -right-6 -bottom-6 h-20 w-20 rounded-full bg-white/10" />
              <div className="flex justify-between items-start">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/20 text-white">
                  <DollarSign className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-6 text-sm font-bold opacity-80">إجمالي المبيعات</p>
              <h3 className="text-3xl font-black mt-1">{formatCurrency(totals.revenue)}</h3>
              <p className="text-[10px] opacity-65 mt-2">القيمة الإجمالية للمدفوعات</p>
            </div>
          </div>

          {/* Project Files styled stores table */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-950">إدارة متاجري</h3>
                <p className="text-xs text-slate-500 mt-1">قائمة المتاجر النشطة وخيارات التحكم بها</p>
              </div>
              <Link href="/dashboard/create" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800 transition">
                <Plus className="h-4 w-4" />
                <span>إنشاء متجر</span>
              </Link>
            </div>

            {stores.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold">
                      <th className="pb-3 pr-2">المتجر</th>
                      <th className="pb-3 text-center">حالة الاشتراك</th>
                      <th className="pb-3 text-center">المنتجات</th>
                      <th className="pb-3 text-center">الطلبات</th>
                      <th className="pb-3 text-center">الإيرادات</th>
                      <th className="pb-3 pl-2 text-left">خيارات التحكم</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {stores.map((store) => (
                      <tr key={store._id} className="group hover:bg-slate-50/50 transition">
                        {/* Store Info */}
                        <td className="py-4 pr-2">
                          <div className="flex items-center gap-3">
                            {store.logo ? (
                              <img
                                src={store.logo}
                                alt={store.name}
                                className="h-10 w-10 rounded-xl object-cover shrink-0 border border-slate-100"
                              />
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white font-bold text-sm">
                                {store.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-black text-slate-950 group-hover:text-teal-600 transition-colors">
                                {store.name}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">/{store.slug}</p>
                            </div>
                          </div>
                        </td>
                        {/* Subscription status */}
                        <td className="py-4 text-center">
                          {store.subscriptionExpired ? (
                            <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-rose-700 border border-rose-100">
                              معلق - انتهى
                            </span>
                          ) : (
                            <span className={cn(
                              "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold border",
                              store.isActive 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                : "bg-slate-50 text-slate-700 border-slate-100"
                            )}>
                              {store.isActive ? "نشط" : "متوقف"}
                            </span>
                          )}
                        </td>
                        {/* Products */}
                        <td className="py-4 text-center font-bold text-slate-800 text-sm">
                          {(store.statistics?.totalProducts ?? 0).toLocaleString("ar-EG")}
                        </td>
                        {/* Orders */}
                        <td className="py-4 text-center font-bold text-slate-800 text-sm">
                          {(store.statistics?.totalOrders ?? 0).toLocaleString("ar-EG")}
                        </td>
                        {/* Revenue */}
                        <td className="py-4 text-center font-bold text-slate-800 text-sm">
                          {formatCurrency(store.statistics?.totalRevenue ?? 0)}
                        </td>
                        {/* Actions */}
                        <td className="py-4 pl-2 text-left">
                          <div className="inline-flex items-center gap-1.5">
                            {store.subscriptionExpired ? (
                              <Link
                                href={`/dashboard/stores/${store.slug}/subscription`}
                                className="inline-flex h-8 items-center gap-1 rounded-xl bg-rose-600 px-3 text-xs font-bold text-white hover:bg-rose-700 transition"
                              >
                                <CreditCard className="h-3.5 w-3.5" />
                                <span>تجديد الباقة</span>
                              </Link>
                            ) : (
                              <Link
                                href={`/dashboard/stores/${store.slug}`}
                                className="inline-flex h-8 items-center gap-1 rounded-xl bg-slate-900 px-3 text-xs font-bold text-white hover:bg-slate-800 transition"
                              >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                <span>إدارة</span>
                              </Link>
                            )}
                            {!store.subscriptionExpired && (
                              <>
                                <Link
                                  href={`/dashboard/stores/${store.slug}/settings`}
                                  className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-950 transition"
                                  title="الإعدادات"
                                >
                                  <Settings className="h-4 w-4" />
                                </Link>
                                <Link
                                  href={`/${store.slug}`}
                                  target="_blank"
                                  className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-950 transition"
                                  title="معاينة المتجر"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Link>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                  <Store className="h-7 w-7" />
                </div>
                <p className="text-sm font-bold text-slate-700">لا توجد متاجر نشطة</p>
                <p className="mt-1 text-xs text-slate-400 max-w-xs leading-relaxed">
                  قم بإنشاء متجرك الأول لإضافة المنتجات والبدء في البيع واستقبال طلبات عملائك.
                </p>
                <Link
                  href="/dashboard/create"
                  className="mt-5 inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-teal-600 px-5 text-xs font-bold text-white hover:bg-teal-700 transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>إنشاء متجر جديد</span>
                </Link>
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="w-full lg:w-80 shrink-0 border-t border-slate-200 bg-white p-6 space-y-6 lg:border-t-0 lg:border-r">
          {/* Calendar Widget */}
          <div className="rounded-3xl border border-slate-100 bg-slate-50/50 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-teal-600" />
                <span>الرزنامة والوقت</span>
              </h4>
              <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">اليوم</span>
            </div>
            <CalendarMock />
          </div>

          {/* Quick Actions (Your Tasks) */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>إجراءات سريعة</span>
            </h4>
            <div className="space-y-2">
              {[
                { title: "إضافة منتج جديد", desc: "أضف أحدث معروضاتك بالمتجر", href: storePath(stores, "/products/new") },
                { title: "تعديل هوية متجرك", desc: "اضبط الشعار والألوان العامة", href: storePath(stores, "/settings") },
                { title: "الطلبات والمبيعات", desc: "تابع حالات شحن وتوصيل الطلبات", href: storePath(stores, "/orders") }
              ].map((act, index) => (
                <Link
                  key={index}
                  href={act.href}
                  className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/30 p-3 hover:border-teal-200 hover:bg-teal-50/20 transition group text-right"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-black text-slate-800 group-hover:bg-teal-500 group-hover:text-white transition">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-slate-800 group-hover:text-teal-700 transition">{act.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{act.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Analytics (Weekly Bar Chart) */}
          <div className="rounded-3xl border border-slate-100 bg-slate-50/50 p-5 space-y-4">
            <h4 className="text-sm font-black text-slate-800">نشاط المبيعات الأسبوعي</h4>
            <div className="flex items-end justify-between gap-2 h-24 pt-4 border-b border-slate-200/60 pb-1">
              {[60, 45, 80, 55, 90, 70, 85].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div
                    className="w-full bg-teal-500/80 rounded-t-sm group-hover:bg-teal-600 transition duration-300"
                    style={{ height: `${h}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[9px] font-bold text-slate-400 px-1">
              <span>ح</span>
              <span>ن</span>
              <span>ث</span>
              <span>ر</span>
              <span>خ</span>
              <span>ج</span>
              <span>س</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// 🗓️ مكون الرزنامة الديناميكي
function CalendarMock() {
  const date = new Date();
  const currentDay = date.getDate();
  const year = date.getFullYear();
  const month = date.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
  
  const weekdays = ["ح", "ن", "ث", "ر", "خ", "ج", "س"];
  const calendarCells = [];
  
  // Empty slots for offsets
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(<div key={`empty-${i}`} className="h-6 w-6" />);
  }
  
  // Fill month days
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = day === currentDay;
    calendarCells.push(
      <div
        key={`day-${day}`}
        className={cn(
          "grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold transition",
          isToday 
            ? "bg-teal-600 text-white font-black shadow-sm" 
            : "text-slate-700 hover:bg-slate-200 cursor-pointer"
        )}
      >
        {day}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-400">
        {weekdays.map(d => (
          <div key={d} className="h-5 w-5 grid place-items-center">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 place-items-center">
        {calendarCells}
      </div>
    </div>
  );
}
