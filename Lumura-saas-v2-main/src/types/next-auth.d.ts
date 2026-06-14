import "next-auth";
import type { TenantRole } from "@/models/Tenant";
import type { Permission, StaffRole } from "@/lib/auth/permissions";

type SessionStore = {
  id: string;
  name: string;
  slug: string;
  permissions?: Permission[];
  isManager?: boolean;
};

declare module "next-auth" {
  interface User {
    id: string;
    name: string;
    email: string;
    role: TenantRole | "store_staff";
    tenantId: string;
    tenantName?: string;
    tenantSlug?: string;
    tenantStatus?: string;
    prgType?: "tenant" | "staff";
    storeId?: string | null;
    storeSlug?: string | null;
    stores?: SessionStore[];
    staffAccess?: SessionStore[];
    staffRole?: StaffRole | null;
    permissions?: Permission[];
    authKind?: "tenant" | "staff";
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: TenantRole | "store_staff";
      tenantId: string;
      tenantName?: string;
      tenantSlug?: string;
      tenantStatus?: string;
      prgType?: "tenant" | "staff";
      storeId?: string | null;
      storeSlug?: string | null;
      stores?: SessionStore[];
      staffAccess?: SessionStore[];
      staffRole?: StaffRole | null;
      permissions?: Permission[];
      authKind?: "tenant" | "staff";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: TenantRole | "store_staff";
    tenantId: string;
    tenantName?: string;
    tenantSlug?: string;
    tenantStatus?: string;
    prgType?: "tenant" | "staff";
    storeId?: string | null;
    storeSlug?: string | null;
    stores?: SessionStore[];
    staffAccess?: SessionStore[];
    staffRole?: StaffRole | null;
    permissions?: Permission[];
    authKind?: "tenant" | "staff";
  }
}
