"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut, LayoutDashboard, Heart, Package, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import type { StorePublicTheme } from "@/lib/store/store-theme";

interface SessionCustomer {
  id: string;
  name: string;
  email: string;
  storeName: string;
}

interface Props {
  theme: StorePublicTheme;
}

export function CustomerNav({ theme }: Props) {
  const router = useRouter();
  const base = `/${theme.slug}`;
  const [customer, setCustomer] = useState<SessionCustomer | null>(null);
  const [isStoreOwner, setIsStoreOwner] = useState(false);
  const [dashboardUrl, setDashboardUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/customer/session?storeSlug=${encodeURIComponent(theme.slug)}`)
      .then((r) => r.json())
      .then((data) => {
        setCustomer(data.customer ?? data.user ?? null);
        setIsStoreOwner(Boolean(data.isStoreOwner));
        setDashboardUrl(data.dashboardUrl);
      })
      .catch(() => {});
  }, [theme.slug]);

  const logout = async () => {
    await fetch("/api/customer/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeSlug: theme.slug }),
    });
    setCustomer(null);
    setOpen(false);
    router.refresh();
    toast.success("تم تسجيل الخروج");
  };

  const loginHref = `${base}/login`;

  return (
    <div className="relative flex items-center gap-1">
      {isStoreOwner && dashboardUrl && (
        <Link
          href={dashboardUrl}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-sm mr-1"
          style={{ backgroundColor: "var(--store-secondary)" }}
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
          إدارة المتجر
        </Link>
      )}

      {customer ? (
        <>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 rounded-full py-1.5 pl-2 pr-3 hover:bg-white/80 transition-colors"
            style={{ color: "var(--store-primary)" }}
            aria-label="حسابي"
          >
            <span className="hidden sm:inline text-xs font-medium max-w-[100px] truncate">
              {customer.name}
            </span>
            <span
              className="grid h-8 w-8 place-items-center rounded-full text-white text-sm font-bold"
              style={{ backgroundColor: "var(--store-primary)" }}
            >
              {customer.name.charAt(0)}
            </span>
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-xl border bg-white shadow-lg py-2 text-sm">
                <p className="px-4 py-2 text-xs text-muted-foreground border-b truncate">
                  {customer.email}
                </p>
                <Link
                  href={`${base}/account`}
                  className="flex items-center gap-2 px-4 py-2.5 hover:bg-muted/50"
                  onClick={() => setOpen(false)}
                >
                  <User className="h-4 w-4" />
                  حسابي
                </Link>
                <Link
                  href={`${base}/orders`}
                  className="flex items-center gap-2 px-4 py-2.5 hover:bg-muted/50"
                  onClick={() => setOpen(false)}
                >
                  <Package className="h-4 w-4" />
                  طلباتي
                </Link>
                <Link
                  href={`${base}/wishlist`}
                  className="flex items-center gap-2 px-4 py-2.5 hover:bg-muted/50"
                  onClick={() => setOpen(false)}
                >
                  <Heart className="h-4 w-4" />
                  المفضلة
                </Link>
                <Link
                  href={`${base}/cart`}
                  className="flex items-center gap-2 px-4 py-2.5 hover:bg-muted/50"
                  onClick={() => setOpen(false)}
                >
                  <ShoppingCart className="h-4 w-4" />
                  السلة
                </Link>
                {isStoreOwner && dashboardUrl && (
                  <Link
                    href={dashboardUrl}
                    className="flex items-center gap-2 px-4 py-2.5 hover:bg-muted/50 sm:hidden border-t mt-1 pt-2"
                    onClick={() => setOpen(false)}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    إدارة المتجر
                  </Link>
                )}
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-destructive hover:bg-destructive/5 border-t mt-1"
                >
                  <LogOut className="h-4 w-4" />
                  تسجيل الخروج
                </button>
              </div>
            </>
          )}
        </>
      ) : (
        <Link
          href={loginHref}
          className="rounded-full p-2.5 transition-colors hover:bg-white/80"
          style={{ color: "var(--store-primary)" }}
          title={theme.language === "ar" ? "تسجيل الدخول" : "Sign in"}
        >
          <User className="h-5 w-5" />
        </Link>
      )}
    </div>
  );
}
