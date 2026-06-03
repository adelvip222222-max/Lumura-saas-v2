// src/lib/auth.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "./db/mongodb";
import Tenant from "@/models/Tenant";
import Store from "@/models/Store";
import Subscription from "@/models/Subscription";
import {
  isStaffRole,
  rolePermissions,
  resolveEffectivePermissions,
  type TenantRole,
  type Permission,
} from "@/lib/auth/permissions";
import { AuditAction, auditLog } from "@/lib/audit/audit-logger";
import {
  trackLoginFailure,
  getLoginFailureCount,
  resetLoginFailures,
} from "@/lib/middleware/rate-limit";
import { AuthErrorCode, getAuthErrorMessage, GENERIC_AUTH_ERROR } from "@/lib/auth/auth-errors";

type SessionStore = {
  id: string;
  name: string;
  slug: string;
  permissions?: Permission[];
  isManager?: boolean;
};

async function getActiveStaffAccess(
  user: any,
  role: TenantRole,
  fallbackStore?: any
): Promise<SessionStore[]> {
  const legacyPermissions = (rolePermissions[role] ?? []) as Permission[];
  const configuredAccess = Array.isArray(user.staffAccess) ? user.staffAccess : [];
  const accessSource =
    configuredAccess.length > 0
      ? configuredAccess
      : fallbackStore
        ? [
            {
              storeId: fallbackStore._id,
              storeSlug: fallbackStore.slug,
              storeName: fallbackStore.name,
              permissions: legacyPermissions,
              isManager: false,
            },
          ]
        : [];

  const storeIds = accessSource.map((item: any) => item.storeId).filter(Boolean);
  const now = new Date();
  const [accessStores, subscriptions] = await Promise.all([
    Store.find({
      _id: { $in: storeIds },
      isDeleted: false,
    })
      .select("_id slug name isActive")
      .lean(),
    Subscription.find({
      storeId: { $in: storeIds },
    })
      .select("storeId status endDate")
      .lean(),
  ]);
  const storeById = new Map(
    accessStores.map((item: any) => [item._id.toString(), item])
  );
  const subscriptionByStoreId = new Map(
    subscriptions.map((item: any) => [item.storeId.toString(), item])
  );

  return accessSource
    .map((item: any) => {
      const storeId = item.storeId?.toString?.();
      if (!storeId) return null;

      const assignedStore = storeById.get(storeId);
      const subscription = subscriptionByStoreId.get(storeId);
      const subscriptionActive =
        subscription &&
        ["active", "trialing"].includes(subscription.status) &&
        new Date(subscription.endDate) > now;

      const canUseStore = subscription ? subscriptionActive : assignedStore?.isActive;
      if (!assignedStore || !canUseStore) return null;

      return {
        id: storeId,
        name: assignedStore.name ?? item.storeName,
        slug: assignedStore.slug ?? item.storeSlug,
        permissions: resolveEffectivePermissions(
          role,
          ((item.permissions ?? user.permissions ?? []) as Permission[]),
          Boolean(item.isManager)
        ),
        isManager: Boolean(item.isManager),
      } satisfies SessionStore;
    })
    .filter(Boolean) as SessionStore[];
}

export const authConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");

        if (!email || !password) {
          throw new Error(AuthErrorCode.INVALID_CREDENTIALS);
        }

        await connectToDatabase();

        // Check if account is locked due to too many failed attempts
        const failureCount = await getLoginFailureCount(email);
        if (failureCount >= 3) {
          // Account is locked
          await auditLog({
            userEmail: email,
            action: AuditAction.LOGIN_FAILED,
            resource: "tenant",
            status: "failure",
            error: "Account locked - too many failed attempts",
          });

          throw new Error(AuthErrorCode.ACCOUNT_LOCKED);
        }

        const user = await Tenant.findOne({ email }).select("+password");
        if (!user) {
          // Track failed attempt
          await trackLoginFailure(email);
          await auditLog({
            userEmail: email,
            action: AuditAction.LOGIN_FAILED,
            resource: "tenant",
            status: "failure",
            error: "Invalid credentials",
          });

          throw new Error(AuthErrorCode.INVALID_CREDENTIALS);
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          // Track failed attempt
          await trackLoginFailure(email);
          await auditLog({
            userEmail: email,
            action: AuditAction.LOGIN_FAILED,
            resource: "tenant",
            status: "failure",
            error: "Invalid password",
            userId: user._id.toString(),
          });

          throw new Error(AuthErrorCode.INVALID_CREDENTIALS);
        }

        if (!user.isActive) {
          await auditLog({
            userEmail: email,
            action: AuditAction.LOGIN_FAILED,
            resource: "tenant",
            status: "failure",
            error: "Account inactive",
            userId: user._id.toString(),
          });

          throw new Error(AuthErrorCode.ACCOUNT_INACTIVE);
        }

        // Reset failed attempts on successful login
        await resetLoginFailures(email);

        let store: any = null;
        let stores: SessionStore[] = [];
        let activeStaffAccess: SessionStore[] = [];
        let parentTenant: any = null;

        if (isStaffRole(user.role)) {
          if (!user.tenantId) {
            throw new Error("Staff account is not linked to a tenant");
          }

          parentTenant = await Tenant.findById(user.tenantId).lean();
          if (!parentTenant || !parentTenant.isActive) {
            throw new Error("Tenant account is inactive");
          }
        }

        if (user.storeId) {
          store = await Store.findById(user.storeId).lean();
        }

        if (user.role === "tenant_admin") {
          const tenantStores: any[] = await Store.find({
            tenantId: user._id,
            isActive: true,
          }).lean();

          stores = tenantStores.map((tenantStore) => ({
            id: tenantStore._id.toString(),
            name: tenantStore.name,
            slug: tenantStore.slug,
          }));
        }

        const role = user.role as TenantRole;
        if (isStaffRole(role)) {
          activeStaffAccess = await getActiveStaffAccess(user, role, store);
          stores = activeStaffAccess;
          const preferredStore =
            activeStaffAccess.find((item) => item.slug === user.storeSlug) ??
            activeStaffAccess[0];

          if (preferredStore) {
            store = {
              _id: preferredStore.id,
              name: preferredStore.name,
              slug: preferredStore.slug,
            };
          } else {
            store = null;
          }
        }

        const currentStoreAccess = activeStaffAccess.find(
          (item) => item.slug === (store?.slug ?? user.storeSlug)
        );
        const permissions = isStaffRole(role)
          ? currentStoreAccess?.permissions ?? []
          : rolePermissions[role] || [];

        // Log successful login
        await auditLog({
          userId: user._id.toString(),
          userEmail: user.email,
          userRole: role,
          tenantId:
            role === "tenant_admin"
              ? user._id.toString()
              : user.tenantId?.toString(),
          action: AuditAction.LOGIN,
          resource: "tenant",
          status: "success",
        });

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role,
          tenantId:
            role === "tenant_admin"
              ? user._id.toString()
              : user.tenantId?.toString(),
          tenantName: role === "tenant_admin" ? user.name : parentTenant?.name,
          tenantSlug: role === "tenant_admin" ? user.slug : parentTenant?.slug,
          tenantStatus: role === "tenant_admin" ? user.status : parentTenant?.status,
          prgType: user.prgType ?? (isStaffRole(role) ? "staff" : "tenant"),
          storeId: isStaffRole(role)
            ? store?._id?.toString() ?? null
            : store?._id?.toString() ?? user.storeId?.toString() ?? null,
          storeSlug: isStaffRole(role)
            ? store?.slug ?? null
            : store?.slug ?? user.storeSlug ?? null,
          stores,
          staffAccess: activeStaffAccess,
          permissions,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.tenantName = user.tenantName;
        token.tenantSlug = user.tenantSlug;
        token.tenantStatus = user.tenantStatus;
        token.prgType = user.prgType;
        token.storeId = user.storeId;
        token.storeSlug = user.storeSlug;
        token.stores = user.stores;
        token.staffAccess = user.staffAccess;
        token.permissions = user.permissions;
      } else if (
        token.id &&
        isStaffRole(token.role as string) &&
        (!(token.stores as SessionStore[] | undefined)?.length || !token.storeSlug)
      ) {
        await connectToDatabase();
        const staffUser: any = await Tenant.findById(token.id).lean();

        if (staffUser?.isActive) {
          const fallbackStore = staffUser.storeId
            ? await Store.findById(staffUser.storeId).lean()
            : null;
          const role = staffUser.role as TenantRole;
          const staffAccess = await getActiveStaffAccess(staffUser, role, fallbackStore);
          const preferredStore =
            staffAccess.find((item) => item.slug === token.storeSlug) ?? staffAccess[0];

          token.role = role;
          token.tenantId = staffUser.tenantId?.toString();
          const parentTenant: any = staffUser.tenantId
            ? await Tenant.findById(staffUser.tenantId).select("name slug status").lean()
            : null;
          token.tenantName = parentTenant?.name;
          token.tenantSlug = parentTenant?.slug;
          token.tenantStatus = parentTenant?.status;
          token.prgType = staffUser.prgType ?? "staff";
          token.storeId = preferredStore?.id ?? null;
          token.storeSlug = preferredStore?.slug ?? null;
          token.stores = staffAccess;
          token.staffAccess = staffAccess;
          token.permissions = preferredStore?.permissions ?? [];
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as TenantRole;
        session.user.tenantId = token.tenantId as string;
        session.user.tenantName = token.tenantName as string | undefined;
        session.user.tenantSlug = token.tenantSlug as string | undefined;
        session.user.tenantStatus = token.tenantStatus as string | undefined;
        session.user.prgType = token.prgType as "tenant" | "staff" | undefined;
        session.user.storeId = token.storeId as string | null | undefined;
        session.user.storeSlug = token.storeSlug as string | null | undefined;
        session.user.stores = (token.stores ?? []) as SessionStore[];
        session.user.staffAccess = (token.staffAccess ?? []) as SessionStore[];
        session.user.permissions = (token.permissions ?? []) as Permission[];
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url;

      try {
        const parsed = new URL(url);
        if (parsed.origin === baseUrl) return url;
      } catch {}

      return baseUrl;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
