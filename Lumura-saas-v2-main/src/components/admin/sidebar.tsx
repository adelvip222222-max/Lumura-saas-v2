// src/components/dashboard/admin-sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tag,
  Award,
  BarChart3,
  Settings,
  Warehouse,
  FileText,
  ChevronLeft,
  ChevronRight,
  Store,
  LogOut,
  CreditCard,
  UserCog
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useTranslation } from "@/hooks/use-translation";
import {
  STORE_NAV_ITEMS,
  canAccessStorePath,
  getStoreAccessPermissions,
  isStaffRole,
  isStoreManager,
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

interface AdminSidebarProps {
  storeSlug?: string;
  stores?: Array<{
    id: string;
    name: string;
    slug: string;
    permissions?: string[];
    isManager?: boolean;
  }>;
}

export function AdminSidebar({ storeSlug, stores = [] }: AdminSidebarProps) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { t, isRTL } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const [storesOpen, setStoresOpen] = useState(false);

  // استخراج دور المستخدم الحالي من الجلسة
  const userRole = session?.user?.role as TenantRole | undefined;

  const isStaff = isStaffRole(userRole);
  const currentStoreSlug = storeSlug || (params?.storeSlug as string);
  const isInStore = !!currentStoreSlug;
  const currentPermissions =
    userRole && currentStoreSlug
      ? getStoreAccessPermissions(session?.user?.stores, currentStoreSlug)
      : [];
  const currentIsManager =
    userRole && currentStoreSlug
      ? isStoreManager(session?.user?.stores, currentStoreSlug)
      : false;
// قم بالبحث عن هذا المتغير داخل src/components/dashboard/admin-sidebar.tsx واستبدله بالكامل
  const navItems = isInStore
    ? STORE_NAV_ITEMS.filter((item) =>
        // ✅ فلترة الروابط بناءً على الدور المسموح به فقط
        userRole
          ? canAccessStorePath(
              `/dashboard/stores/${currentStoreSlug}${item.pathSuffix}`,
              userRole,
              currentStoreSlug,
              currentPermissions,
              currentIsManager
            )
          : false
      ).map((item) => ({
        title: t(item.titleKey, item.titleDefault),
        href: `/dashboard/stores/${currentStoreSlug}${item.pathSuffix}`,
        icon: NAV_ICONS[item.pathSuffix] ?? LayoutDashboard,
      }))
    : [
        {
          title: t("sidebar.dashboard", "لوحة التحكم"),
          href: "/dashboard",
          icon: LayoutDashboard,
        },
      ];

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  return (
    <aside
      className={cn(
        "flex flex-col bg-white border-l border-gray-200 transition-all duration-300 shadow-sm h-screen sticky top-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-gray-200 px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-gray-800">
              MEMO<span className="text-orange-500">DEV</span>
            </span>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">M</span>
            </div>
          </Link>
        )}
      </div>

      {/* متاجر المستأجر */}
      {stores.length > 0 && !isInStore && !isStaff && !collapsed && (
        <div className="border-b border-gray-200 p-3">
          <button
            onClick={() => setStoresOpen(!storesOpen)}
            className="flex items-center justify-between w-full px-2 py-1.5 text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors rounded-lg"
          >
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              <span>{t("sidebar.myStores", "متاجري")}</span>
            </div>
            <ChevronLeft 
              className={cn(
                "h-4 w-4 transition-transform", 
                storesOpen && (isRTL ? "rotate-90" : "-rotate-90")
              )} 
            />
          </button>
          {storesOpen && (
            <div className={cn(
              "mt-2 space-y-1",
              isRTL ? "mr-4" : "ml-4"
            )}>
              {stores.map((store) => (
                <Link
                  key={store.id}
                  href={`/dashboard/stores/${store.slug}`}
                  className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                >
                  <Store className="h-3.5 w-3.5" />
                  <span className="truncate">{store.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Breadcrumb */}
      {isInStore && !collapsed && (
        <div className="border-b border-gray-200 p-3">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Store className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium text-gray-700 truncate">
              {stores.find(s => s.slug === currentStoreSlug)?.name || currentStoreSlug}
            </span>
          </div>
          {!isStaff && (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 mt-2 text-xs text-gray-500 hover:text-orange-500 transition-colors"
            >
              {t("sidebar.backToAllStores", "← العودة إلى جميع المتاجر")}
            </Link>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = item.href === "/dashboard" && !isInStore
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                    isActive
                      ? cn(
                          "bg-orange-50 text-orange-600",
                          isRTL ? "border-r-2 border-orange-500" : "border-l-2 border-orange-500"
                        )
                      : "text-gray-600 hover:bg-gray-50 hover:text-orange-500"
                  )}
                  title={collapsed ? item.title : undefined}
                >
                  <item.icon className={cn(
                    "h-5 w-5 shrink-0",
                    isActive ? "text-orange-500" : "text-gray-400"
                  )} />
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-2 space-y-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-50 hover:text-orange-500 transition-colors"
          aria-label={collapsed ? t("sidebar.expand", "توسيع") : t("sidebar.collapse", "طي")}
        >
          {collapsed ? (
            isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          ) : (
            isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />
          )}
        </button>

        <button
          onClick={handleSignOut}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors",
            collapsed && "justify-center"
          )}
          title={collapsed ? t("sidebar.signOut", "تسجيل الخروج") : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>{t("sidebar.signOut", "تسجيل الخروج")}</span>}
        </button>
      </div>
    </aside>
  );
}
