import { auth } from "@/lib/auth/auth";
import type { UserRole } from "@/types";

export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }

  return session;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth();

  if (!allowedRoles.includes(session.user.role)) {
    throw new Error("FORBIDDEN");
  }

  return session;
}

export async function requireAdmin() {
  return requireRole(["admin", "super_admin"]);
}

export async function requireSuperAdmin() {
  return requireRole(["super_admin"]);
}

export async function getOptionalSession() {
  return auth();
}

export function isAdmin(role: UserRole): boolean {
  return role === "admin" || role === "super_admin";
}

export function isSuperAdmin(role: UserRole): boolean {
  return role === "super_admin";
}
