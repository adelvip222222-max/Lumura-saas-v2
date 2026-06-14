"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { Session } from "next-auth";
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Store,
  Tag,
  Users,
  Warehouse,
  X,
  Award,
  CreditCard,
  UserCog,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  STORE_NAV_ITEMS,
  canAccessStorePath,
  type Permission,
  type TenantRole,
} from "@/lib/auth/permissions";

const NAV_ICONS: Record<string, typeof LayoutDashboard> = {
  "": LayoutDashboard,
  "/products": Package,
  "/orders": ShoppingCart,
  "/customers": Users,
  "/categories": Tag,
  "/brands": Award,
  "/inventory": Warehouse,
  "/reports": FileText,
  "/analytics": BarChart3,
  "/subscription": CreditCard,
  "/team": UserCog,
  "/settings": Settings,
};

const MOBILE_PRIMARY_SUFFIXES = ["", "/products", "/orders", "/settings"];

type SidebarStore = {
  id: string;
  name: string;
  slug: string;
  permissions?: string[];
  isManager?: boolean;
};

interface StoreDashboardShellProps {
  children: React.ReactNode;
  user: Session["user"];
  storeSlug: string;
  stores: SidebarStore[];
  userRole: TenantRole;
  permissions: Permission[];
  isManager: boolean;
}

export function StoreDashboardShell({
  children,
  user,
  storeSlug,
  stores,
  userRole,
  permissions,
  isManager,
}: StoreDashboardShellProps) {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const accessibleItems = useMemo(
    () =>
      STORE_NAV_ITEMS.filter((item) =>
        canAccessStorePath(
          `/dashboard/stores/${storeSlug}${item.pathSuffix}`,
          userRole,
          storeSlug,
          permissions,
          isManager
        )
      ).map((item) => ({
        ...item,
        href: `/dashboard/stores/${storeSlug}${item.pathSuffix}`,
        icon: NAV_ICONS[item.pathSuffix] ?? LayoutDashboard,
      })),
    [isManager, permissions, storeSlug, userRole]
  );

  const primaryMobileItems = accessibleItems.filter((item) =>
    MOBILE_PRIMARY_SUFFIXES.includes(item.pathSuffix)
  );

  return (
    <div className="min-h-dvh bg-slate-50" dir="rtl">
      {/* Desktop sidebar */}
      <div className="fixed inset-y-0 right-0 z-30 hidden border-l border-gray-200 bg-white lg:block">
        <AdminSidebar storeSlug={storeSlug} stores={stores} />
      </div>

      {/* Mobile drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="إغلاق القائمة"
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px]"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 flex w-[86vw] max-w-sm flex-col overflow-hidden rounded-l-3xl bg-white shadow-2xl">
            <div className="flex h-14 items-center justify-between border-b border-gray-100 px-4">
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-orange-500 text-white shadow-sm">
                  <Store className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">قائمة المتجر</p>
                  <p className="text-xs text-gray-500">{storeSlug}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setMobileSidebarOpen(false)}
                aria-label="إغلاق القائمة"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <AdminSidebar storeSlug={storeSlug} stores={stores} />
            </div>
          </div>
        </div>
      )}

      <div className="flex min-h-dvh flex-col lg:pr-64">
        <AdminHeader
          user={user}
          onMobileMenuClick={() => setMobileSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto bg-slate-50 p-3 pb-28 sm:p-4 lg:p-6 lg:pb-6">
          <div className="mx-auto max-w-7xl rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Visible handle while the drawer is closed */}
      {!mobileSidebarOpen && (
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="fixed bottom-24 right-3 z-40 flex items-center gap-2 rounded-full border border-orange-200 bg-white px-3 py-2 text-xs font-semibold text-orange-600 shadow-lg shadow-orange-950/10 lg:hidden"
          aria-label="فتح القائمة الجانبية"
        >
          <Menu className="h-4 w-4" />
          القائمة
        </button>
      )}

      {/* Mobile bottom navigation: only the most important links */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-2 pb-2 pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {primaryMobileItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.pathSuffix !== "" && pathname.startsWith(`${item.href}/`));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-medium transition-colors",
                  active
                    ? "bg-orange-50 text-orange-600"
                    : "text-gray-500 hover:bg-gray-50 hover:text-orange-600"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="max-w-full truncate">{item.titleDefault}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-orange-600"
            aria-label="المزيد من القوائم"
          >
            <Menu className="h-5 w-5" />
            <span>المزيد</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
