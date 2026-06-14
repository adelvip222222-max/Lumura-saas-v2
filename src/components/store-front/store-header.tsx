"use client";

import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import type { StorePublicTheme } from "@/lib/store/store-theme";
import { getStoreDisplayName } from "@/lib/store/store-theme";
import { CustomerNav } from "@/components/store-front/customer-nav";
import { CartDropdown } from "@/components/store-front/cart-dropdown";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";

export function StoreHeader({ theme }: { theme: StorePublicTheme }) {
  const isAr = theme.language === "ar";
  const displayName = getStoreDisplayName(theme);

  const navItems = [
    { href: `/${theme.slug}/products`, label: isAr ? "المنتجات" : "Products" },
    { href: `/${theme.slug}/categories`, label: isAr ? "الفئات" : "Categories" },
    { href: `/${theme.slug}/brands`, label: isAr ? "الماركات" : "Brands" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
      <div className="mx-auto grid h-20 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-bold uppercase tracking-wide text-slate-700 transition hover:text-[var(--store-primary)]"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <Link href={`/${theme.slug}`} className="justify-self-start md:justify-self-center">
          <span className="flex items-center gap-3">
            {theme.logo ? (
              <Image
                src={theme.logo}
                alt={displayName}
                width={44}
                height={44}
                className="h-11 w-11 rounded-full object-cover"
                unoptimized
              />
            ) : (
              <span className="grid h-11 w-11 place-items-center rounded-full bg-slate-950 text-base font-black text-white">
                {displayName.charAt(0)}
              </span>
            )}
            <span className="hidden max-w-[150px] truncate text-xl font-black tracking-normal text-slate-950 sm:inline">
              {displayName}
            </span>
          </span>
        </Link>

        <div className="flex items-center justify-end gap-2">
          <PWAInstallPrompt />
          <Link
            href={`/${theme.slug}/search`}
            className="grid h-10 w-10 place-items-center rounded-full text-slate-700 transition hover:bg-slate-100 hover:text-[var(--store-primary)]"
            title={isAr ? "بحث" : "Search"}
          >
            <Search className="h-5 w-5" />
          </Link>
          <CartDropdown theme={theme} />
          <CustomerNav theme={theme} />
        </div>
      </div>
    </header>
  );
}
