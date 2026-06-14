// src/components/admin/admin-header.tsx
"use client";

import { LogOut, ExternalLink, ChevronDown, Menu } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { NotificationsBell } from "@/components/ui/notifications-bell";
import { getInitials } from "@/lib/utils";
import { useState } from "react";
import type { Session } from "next-auth";

interface AdminHeaderProps {
  user: Session["user"];
  onMobileMenuClick?: () => void;
}

export function AdminHeader({ user, onMobileMenuClick }: AdminHeaderProps) {
  const { data: session } = useSession();
  const params = useParams();
  const pathname = usePathname();
  const [showStoreMenu, setShowStoreMenu] = useState(false);
  
  const storeSlug = params?.storeSlug as string || session?.user?.storeSlug || user?.stores?.[0]?.slug;
  
  const getPageTitle = () => {
    if (pathname.includes('/products')) return 'المنتجات';
    if (pathname.includes('/categories')) return 'الفئات';
    if (pathname.includes('/brands')) return 'العلامات التجارية';
    if (pathname.includes('/orders')) return 'الطلبات';
    if (pathname.includes('/customers')) return 'العملاء';
    if (pathname.includes('/inventory')) return 'المخزون';
    if (pathname.includes('/analytics')) return 'الإحصائيات';
    if (pathname.includes('/reports')) return 'التقارير';
    if (pathname.includes('/settings')) return 'الإعدادات';
    if (pathname.includes('/subscription')) return 'الاشتراك';
    if (pathname.includes('/team')) return 'فريق العمل';
    return 'لوحة التحكم';
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-3 shadow-sm sm:px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {onMobileMenuClick && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-gray-600 hover:bg-orange-50 hover:text-orange-600 lg:hidden"
            onClick={onMobileMenuClick}
            aria-label="فتح القائمة الجانبية"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-gray-900 sm:text-lg">
            {getPageTitle()}
          </h1>
          <p className="hidden text-xs text-gray-500 sm:block">
            {storeSlug ? `المتجر: ${storeSlug}` : 'منصة MEMO DEV'}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 md:gap-3">
        {storeSlug && (
          <Button 
            variant="outline" 
            size="sm" 
            title="معاينة المتجر"
            className="hidden items-center gap-2 border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700 md:inline-flex"
          >
            <Link href={`/${storeSlug}`} target="_blank" className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              <span>معاينة المتجر</span>
            </Link>
          </Button>
        )}

        {storeSlug && (
          <Button 
            variant="ghost" 
            size="icon" 
            title="معاينة المتجر"
            className="text-orange-500 hover:bg-orange-50 md:hidden"
          >
            <Link href={`/${storeSlug}`} target="_blank" aria-label="معاينة المتجر">
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        )}

        <LanguageSwitcher />
        <NotificationsBell />

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowStoreMenu(!showStoreMenu)}
            className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-gray-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-sm font-medium text-white shadow-sm">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name ?? "User"}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                getInitials(user.name ?? "Admin")
              )}
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs capitalize text-gray-500">{user.role?.replace('_', ' ')}</p>
            </div>
            <ChevronDown className="hidden h-4 w-4 text-gray-400 sm:block" />
          </button>

          {showStoreMenu && (
            <div className="absolute left-0 top-full z-50 mt-2 w-48 rounded-lg border border-gray-100 bg-white py-1 shadow-lg">
              <div className="border-b border-gray-100 px-3 py-2">
                <p className="text-xs text-gray-500">الحساب</p>
                <p className="truncate text-sm font-medium text-gray-900">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                تسجيل الخروج
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
