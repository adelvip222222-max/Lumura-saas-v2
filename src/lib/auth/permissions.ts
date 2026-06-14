import type { AdminPermission, TenantRole } from "@/models/Tenant";

export type { AdminPermission, TenantRole } from "@/models/Tenant";

export type Permission = AdminPermission | "*";

export const ADMIN_PERMISSIONS = [
  "manage_products",
  "manage_orders",
  "manage_customers",
  "manage_inventory",
  "manage_categories",
  "manage_brands",
  "view_reports",
  "view_analytics",
  "manage_settings",
  "manage_staff",
  "manage_subscription",
] as const satisfies readonly AdminPermission[];

export const STORE_MANAGER_PERMISSIONS = [...ADMIN_PERMISSIONS];

export const PERMISSION_LABELS: Record<AdminPermission, { ar: string; en: string }> = {
  manage_products: { ar: "إدارة المنتجات", en: "Manage products" },
  manage_orders: { ar: "إدارة الطلبات", en: "Manage orders" },
  manage_customers: { ar: "إدارة العملاء", en: "Manage customers" },
  manage_inventory: { ar: "إدارة المخازن", en: "Manage inventory" },
  manage_categories: { ar: "إدارة الفئات", en: "Manage categories" },
  manage_brands: { ar: "إدارة الماركات", en: "Manage brands" },
  view_reports: { ar: "عرض التقارير", en: "View reports" },
  view_analytics: { ar: "عرض التحليلات", en: "View analytics" },
  manage_settings: { ar: "إدارة الإعدادات", en: "Manage settings" },
  manage_staff: { ar: "إدارة فريق العمل", en: "Manage staff" },
  manage_subscription: { ar: "إدارة الاشتراك", en: "Manage subscription" },
};

export const STAFF_ROLES = [
  "staff_member",
  "staff_orders",
  "staff_products",
  "staff_reports",
] as const;

export const LEGACY_STAFF_ROLES = [
  "staff_orders",
  "staff_products",
  "staff_reports",
] as const;

export const ADMIN_ROLES = ["super_admin", "tenant_admin"] as const;

export type StaffRole = typeof STAFF_ROLES[number];

export function isStaffRole(role?: string | null): role is StaffRole {
  return STAFF_ROLES.includes(role as StaffRole);
}

export const rolePermissions: Record<TenantRole, Permission[]> = {
  super_admin: ["*"],
  tenant_admin: ["*"],
  staff_member: [],
  staff_orders: ["manage_orders", "manage_customers"],
  staff_products: [
    "manage_products",
    "manage_categories",
    "manage_brands",
    "manage_inventory",
  ],
  staff_reports: ["view_reports", "view_analytics", "manage_inventory"],
};

export const MAX_STAFF_PER_TENANT = 3;

export const STAFF_ROLE_LABELS: Record<StaffRole, { ar: string; en: string }> = {
  staff_member: { ar: "موظف مخصص", en: "Custom Staff" },
  staff_orders: { ar: "مدير الطلبات", en: "Orders Manager" },
  staff_products: { ar: "مدير المنتجات", en: "Products Manager" },
  staff_reports: { ar: "مشاهد التقارير", en: "Reports Viewer" },
};

export interface StoreAccessLike {
  id?: string;
  storeId?: string;
  name?: string;
  storeName?: string;
  slug?: string;
  storeSlug?: string;
  permissions?: Permission[];
  isManager?: boolean;
}

function uniquePermissions(permissions: Permission[]) {
  return [...new Set(permissions)];
}

export function resolveEffectivePermissions(
  role: TenantRole,
  permissions: Permission[] = [],
  isManager = false
): Permission[] {
  if (role === "super_admin" || role === "tenant_admin") return ["*"];
  if (isManager) return STORE_MANAGER_PERMISSIONS;
  return uniquePermissions([...(rolePermissions[role] ?? []), ...permissions]);
}

export function hasPermission(
  role: TenantRole,
  permission: Permission,
  permissions: Permission[] = [],
  isManager = false
): boolean {
  const effective = resolveEffectivePermissions(role, permissions, isManager);
  if (effective.includes("*")) return true;
  return effective.includes(permission);
}

export const STORE_NAV_ITEMS = [
  {
    titleKey: "sidebar.dashboard",
    titleDefault: "لوحة التحكم",
    pathSuffix: "",
    permission: null,
  },
  {
    titleKey: "sidebar.products",
    titleDefault: "المنتجات",
    pathSuffix: "/products",
    permission: "manage_products",
  },
  {
    titleKey: "sidebar.orders",
    titleDefault: "الطلبات",
    pathSuffix: "/orders",
    permission: "manage_orders",
  },
  {
    titleKey: "sidebar.customers",
    titleDefault: "العملاء",
    pathSuffix: "/customers",
    permission: "manage_customers",
  },
  {
    titleKey: "sidebar.categories",
    titleDefault: "الفئات",
    pathSuffix: "/categories",
    permission: "manage_categories",
  },
  {
    titleKey: "sidebar.brands",
    titleDefault: "الماركات",
    pathSuffix: "/brands",
    permission: "manage_brands",
  },
  {
    titleKey: "sidebar.inventory",
    titleDefault: "المخازن",
    pathSuffix: "/inventory",
    permission: "manage_inventory",
  },
  {
    titleKey: "sidebar.reports",
    titleDefault: "التقارير",
    pathSuffix: "/reports",
    permission: "view_reports",
  },
  {
    titleKey: "sidebar.analytics",
    titleDefault: "التحليلات",
    pathSuffix: "/analytics",
    permission: "view_analytics",
  },
  {
    titleKey: "sidebar.team",
    titleDefault: "فريق العمل",
    pathSuffix: "/team",
    permission: "manage_staff",
  },
  {
    titleKey: "sidebar.subscription",
    titleDefault: "الاشتراك",
    pathSuffix: "/subscription",
    permission: "manage_subscription",
  },
  {
    titleKey: "sidebar.settings",
    titleDefault: "الإعدادات",
    pathSuffix: "/settings",
    permission: "manage_settings",
  },
] as const satisfies readonly {
  titleKey: string;
  titleDefault: string;
  pathSuffix: string;
  permission: AdminPermission | null;
}[];

export function getStorePathSuffix(pathname: string, storeSlug: string): string {
  const suffix = pathname.replace(`/dashboard/stores/${storeSlug}`, "");
  return suffix === "/" ? "" : suffix;
}

export function getStoreAccess(
  stores: StoreAccessLike[] | undefined,
  storeSlug: string
) {
  return stores?.find((store) => (store.slug ?? store.storeSlug) === storeSlug);
}

export function getStoreAccessPermissions(
  stores: StoreAccessLike[] | undefined,
  storeSlug: string
): Permission[] {
  return (getStoreAccess(stores, storeSlug)?.permissions ?? []) as Permission[];
}

export function isStoreManager(
  stores: StoreAccessLike[] | undefined,
  storeSlug: string
) {
  return Boolean(getStoreAccess(stores, storeSlug)?.isManager);
}

export function canAccessStore(
  role: TenantRole,
  storeSlug: string,
  userStoreSlug?: string,
  stores?: StoreAccessLike[]
): boolean {
  if (role === "super_admin" || role === "tenant_admin") return true;
  if (stores?.some((store) => (store.slug ?? store.storeSlug) === storeSlug)) return true;
  return isStaffRole(role) && storeSlug === userStoreSlug;
}

export function canAccessStorePath(
  pathname: string,
  role: TenantRole,
  storeSlug: string,
  permissions: Permission[] = [],
  isManager = false
): boolean {
  if (role === "super_admin" || role === "tenant_admin") return true;

  const pathSuffix = getStorePathSuffix(pathname, storeSlug);
  const navItem = STORE_NAV_ITEMS.find((item) => {
    if (item.pathSuffix === "" && (pathSuffix === "" || pathSuffix === "/")) {
      return true;
    }

    return item.pathSuffix !== "" && pathSuffix.startsWith(item.pathSuffix);
  });

  if (!navItem) return false;
  if (!navItem.permission) {
    return resolveEffectivePermissions(role, permissions, isManager).length > 0;
  }

  return hasPermission(role, navItem.permission, permissions, isManager);
}

export function getDefaultRedirect(
  role: TenantRole,
  storeSlug?: string,
  permissions: Permission[] = [],
  isManager = false
): string {
  if (role === "super_admin") return "/super-admin";
  if (role === "tenant_admin") return "/dashboard";
  if (!storeSlug) return "/unauthorized";
  if (isManager) return "/ad-i";

  const effective = resolveEffectivePermissions(role, permissions, isManager);

  if (effective.includes("manage_orders")) return "/ad-i-orders";
  if (effective.includes("manage_products")) return "/ad-i-products";
  if (effective.includes("manage_inventory")) return "/ad-i-inventory";
  if (effective.includes("view_reports")) return "/ad-i-reporter";
  if (effective.includes("view_analytics")) return "/ad-i-reporter";

  return "/ad-i";
}
