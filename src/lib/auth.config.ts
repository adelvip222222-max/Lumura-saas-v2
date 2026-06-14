import type { NextAuthConfig } from "next-auth";
import { type TenantRole, type Permission } from "@/lib/auth/permissions";

export const authConfig = {
  providers: [], // Will be populated in auth.ts
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
        session.user.stores = (token.stores ?? []) as any[];
        session.user.staffAccess = (token.staffAccess ?? []) as any[];
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
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  trustHost: true,
} satisfies NextAuthConfig;
