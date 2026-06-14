import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { SubscriptionGate } from "@/components/admin/subscription-gate";
import { requireStoreSession } from "@/lib/auth/require-store-access";
import {
  canAccessStorePath,
  getDefaultRedirect,
  getStoreAccessPermissions,
  isStoreManager,
  isStaffRole,
  type TenantRole,
} from "@/lib/auth/permissions";
import { syncStoreSubscriptionBySlug } from "@/services/subscription.service";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const { session, store } = await requireStoreSession(storeSlug);

  const headersList = await headers();
  const pathname =
    headersList.get("x-pathname") ?? `/dashboard/stores/${storeSlug}`;

  const userRole = session.user.role as TenantRole;
  const storeRootPath = `/dashboard/stores/${storeSlug}`;
  const permissions = getStoreAccessPermissions(session.user.stores, storeSlug);
  const isManager = isStoreManager(session.user.stores, storeSlug);

  if (
    isStaffRole(userRole) &&
    (pathname === storeRootPath || pathname === `${storeRootPath}/`)
  ) {
    const target = getDefaultRedirect(userRole, storeSlug, permissions, isManager);
    if (target !== storeRootPath) {
      redirect(target);
    }
  }

  if (!canAccessStorePath(pathname, userRole, storeSlug, permissions, isManager)) {
    redirect("/unauthorized");
  }

  const subscriptionState = await syncStoreSubscriptionBySlug(storeSlug);
  const storesForSidebar =
    session.user.role.startsWith("staff_")
      ? session.user.stores ?? []
      : session.user.stores ?? [];

  const isDashboardHome = pathname === storeRootPath || pathname === `${storeRootPath}/`;

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <div className="bg-white border-l border-gray-200">
        <AdminSidebar storeSlug={storeSlug} stores={storesForSidebar} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden bg-slate-50">
        <div className="bg-white border-b border-gray-200">
          <AdminHeader user={session.user} />
        </div>

        <main className={`flex-1 overflow-y-auto p-6 md:p-8 ${isDashboardHome ? "bg-[#f8fafc]" : "bg-gray-50"}`}>
          <div className={isDashboardHome ? "" : "bg-white rounded-xl shadow-sm border border-gray-100 p-6"}>
            <SubscriptionGate
              storeSlug={storeSlug}
              storeName={store.name}
              isExpired={subscriptionState?.isExpired ?? false}
              endDate={subscriptionState?.endDate.toISOString()}
            >
              {children}
            </SubscriptionGate>
          </div>
        </main>
      </div>
    </div>
  );
}
