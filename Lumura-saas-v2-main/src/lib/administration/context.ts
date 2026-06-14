import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import {
  getStoreAccessPermissions,
  hasPermission,
  isStoreManager,
  type AdminPermission,
  type Permission,
  type TenantRole,
} from "@/lib/auth/permissions";

export const ADMINISTRATION_ROUTES = [
  {
    href: "/ad-i-orders",
    label: "الطلبات",
    permission: "manage_orders",
  },
  {
    href: "/ad-i-products",
    label: "المنتجات",
    permission: "manage_products",
  },
  {
    href: "/ad-i-categories",
    label: "الفئات",
    permission: "manage_categories",
  },
  {
    href: "/ad-i-brands",
    label: "الماركات",
    permission: "manage_brands",
  },
  {
    href: "/ad-i-inventory",
    label: "المخازن",
    permission: "manage_inventory",
  },
  {
    href: "/ad-i-reporter",
    label: "التقارير",
    permission: "view_reports",
  },
] as const satisfies readonly {
  href: string;
  label: string;
  permission: AdminPermission;
}[];

export type AdministrationRoute = (typeof ADMINISTRATION_ROUTES)[number];

export interface AdministrationContext {
  session: Session;
  role: TenantRole;
  prgType: "tenant" | "staff";
  tenantId: string;
  tenantName?: string;
  userName: string;
  userEmail: string;
  userImage?: string | null;
  storeId: string;
  storeSlug: string;
  storeName: string;
  permissions: Permission[];
  isManager: boolean;
  allowedRoutes: AdministrationRoute[];
  pathname: string;
}

function getRouteByPath(pathname: string) {
  return ADMINISTRATION_ROUTES.find((route) => pathname.startsWith(route.href));
}

function getAllowedRoutes(role: TenantRole, permissions: Permission[], isManager: boolean) {
  return ADMINISTRATION_ROUTES.filter((route) =>
    hasPermission(role, route.permission, permissions, isManager)
  );
}

export async function getAdministrationContext(
  requiredPermission?: AdminPermission
): Promise<AdministrationContext> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as TenantRole;
  if (role === "super_admin") redirect("/super-admin");

  const store = session.user.stores?.[0];
  const storeSlug = session.user.storeSlug ?? store?.slug;
  const storeId = session.user.storeId ?? store?.id;

  if (!session.user.tenantId || !storeSlug || !storeId) {
    redirect("/unauthorized");
  }

  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const permissions = getStoreAccessPermissions(session.user.stores, storeSlug);
  const manager = isStoreManager(session.user.stores, storeSlug);
  const allowedRoutes = getAllowedRoutes(role, permissions, manager);
  const firstRoute = allowedRoutes[0];

  if (!firstRoute) redirect("/unauthorized");
  if (pathname === "/ad-i" || pathname === "/ad-i/") redirect(firstRoute.href);

  const currentRoute = pathname ? getRouteByPath(pathname) : undefined;
  if (currentRoute && !hasPermission(role, currentRoute.permission, permissions, manager)) {
    redirect(firstRoute.href);
  }

  if (requiredPermission && !hasPermission(role, requiredPermission, permissions, manager)) {
    redirect(firstRoute.href);
  }

  return {
    session,
    role,
    prgType: session.user.prgType ?? (role === "tenant_admin" ? "tenant" : "staff"),
    tenantId: session.user.tenantId,
    tenantName: session.user.tenantName,
    userName: session.user.name ?? session.user.email ?? "المستخدم",
    userEmail: session.user.email ?? "",
    userImage: session.user.image ?? null,
    storeId,
    storeSlug,
    storeName: store?.name ?? session.user.storeSlug ?? storeSlug,
    permissions,
    isManager: manager,
    allowedRoutes,
    pathname: pathname || firstRoute.href,
  };
}
