import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { StoreDashboardShell } from "@/components/admin/store-dashboard-shell";
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
  const storesForSidebar = session.user.stores ?? [];

  return (
    <StoreDashboardShell
      user={session.user}
      storeSlug={storeSlug}
      stores={storesForSidebar}
      userRole={userRole}
      permissions={permissions}
      isManager={isManager}
    >
      <SubscriptionGate
        storeSlug={storeSlug}
        storeName={store.name}
        isExpired={subscriptionState?.isExpired ?? false}
        endDate={subscriptionState?.endDate.toISOString()}
      >
        {children}
      </SubscriptionGate>
    </StoreDashboardShell>
  );
}
