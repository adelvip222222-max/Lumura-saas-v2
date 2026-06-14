import Link from "next/link";
import { LogOut, ShieldCheck, Store, UserCircle2 } from "lucide-react";
import { NotificationsBell } from "@/components/ui/notifications-bell";
import { signOut } from "@/lib/auth";
import { getAdministrationContext } from "@/lib/administration/context";
import { cn } from "@/lib/utils";

export default async function AdministrationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getAdministrationContext();

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <aside className="fixed inset-y-0 right-0 z-30 hidden w-64 border-l border-gray-200 bg-white lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-3 border-b px-5">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-orange-500 text-white">
            <Store className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-gray-900">{ctx.storeName}</p>
            <p className="truncate text-xs text-gray-500">{ctx.tenantName ?? "الإدارة العامة"}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {ctx.allowedRoutes.map((route) => {
            const active = ctx.pathname.startsWith(route.href);

            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-orange-50 text-orange-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-orange-600"
                )}
              >
                {route.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-4">
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
            <ShieldCheck className="h-4 w-4 text-orange-500" />
            <span>{ctx.isManager ? "مدير المتجر" : "صلاحيات مخصصة"}</span>
          </div>
        </div>
      </aside>

      <div className="lg:pr-64">
        <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between px-4 py-3 lg:px-8">
            <div>
              <p className="text-xs text-gray-500">لوحة الإدارة العامة</p>
              <h1 className="text-lg font-bold text-gray-900">{ctx.storeName}</h1>
            </div>

            <div className="flex items-center gap-3">
              <NotificationsBell />
              <div className="hidden items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 md:flex">
                <UserCircle2 className="h-5 w-5 text-orange-500" />
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{ctx.userName || "المستخدم"}</p>
                  <p className="text-xs text-gray-500">{ctx.isManager ? "مدير المتجر" : "موظف"}</p>
                </div>
              </div>

              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/login" });
                }}
              >
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
                >
                  <LogOut className="h-4 w-4" />
                  تسجيل الخروج
                </button>
              </form>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t px-4 py-2 lg:hidden">
            {ctx.allowedRoutes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-xs font-medium",
                  ctx.pathname.startsWith(route.href)
                    ? "border-orange-500 bg-orange-50 text-orange-600"
                    : "border-gray-200 bg-white text-gray-600"
                )}
              >
                {route.label}
              </Link>
            ))}
          </div>
        </header>

        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
