// src/components/admin/admin-header.tsx
"use client";

import { Bell, LogOut, User, ExternalLink, Store, ChevronDown } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { getInitials } from "@/lib/utils";
import { useState } from "react";
import type { Session } from "next-auth";

interface AdminHeaderProps {
  user: Session["user"];
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const { data: session } = useSession();
  const params = useParams();
  const pathname = usePathname();
  const [showStoreMenu, setShowStoreMenu] = useState(false);
  
  // ✅ استخراج storeSlug من المسار الحالي أو من session
  const storeSlug = params?.storeSlug as string || session?.user?.storeSlug || user?.stores?.[0]?.slug;
  
  // ✅ تحديد عنوان الصفحة الحالية
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
    return 'لوحة التحكم';
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6 shadow-sm">
      {/* Left Side - Page Title & Breadcrumb */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            {getPageTitle()}
          </h1>
          <p className="text-xs text-gray-500 hidden sm:block">
            {storeSlug ? `المتجر: ${storeSlug}` : 'منصة MEMO DEV'}
          </p>
        </div>
      </div>

      {/* Right Side - Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* ✅ زر معاينة المتجر (محسن) */}
        {storeSlug && (
          <Button 
            variant="outline" 
            size="sm" 
            title="معاينة المتجر"
            className="hidden md:inline-flex items-center gap-2 border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
          >
            <Link href={`/${storeSlug}`} target="_blank" className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              <span>معاينة المتجر</span>
            </Link>
          </Button>
        )}

        {/* زر معاينة المتجر (للشاشات الصغيرة) */}
        {storeSlug && (
          <Button 
            variant="ghost" 
            size="icon" 
            title="معاينة المتجر"
            className="md:hidden text-orange-500 hover:bg-orange-50"
          >
            <Link href={`/${storeSlug}`} target="_blank">
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        )}

        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Notifications */}
        <Button 
          variant="ghost" 
          size="icon" 
          aria-label="Notifications"
          className="relative text-gray-600 hover:bg-gray-100"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-orange-500"></span>
        </Button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowStoreMenu(!showStoreMenu)}
            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100 transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-sm font-medium shadow-sm">
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
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role?.replace('_', ' ')}</p>
            </div>
            <ChevronDown className="hidden sm:block h-4 w-4 text-gray-400" />
          </button>

          {/* Dropdown Menu */}
          {showStoreMenu && (
            <div className="absolute left-0 top-full mt-2 w-48 rounded-lg bg-white shadow-lg border border-gray-100 py-1 z-50">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs text-gray-500">الحساب</p>
                <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                تسجيل الخروج
              </button>
            </div>
          )}
        </div>

        {/* Logout Button (Mobile - Simple) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => signOut({ callbackUrl: "/login" })}
          aria-label="Logout"
          className="md:hidden text-gray-600 hover:text-red-500"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}