import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  canAccessStore,
  canAccessStorePath,
  getStoreAccessPermissions,
  hasPermission,
  isStoreManager,
  type Permission,
  type TenantRole,
} from "@/lib/auth/permissions";
import { connectToDatabase } from "@/lib/db/mongodb";
import Store from "@/models/Store";

export async function requireStoreSession(storeSlug: string) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  await connectToDatabase();

  const userRole = session.user.role as TenantRole;
  const storeQuery =
    userRole === "super_admin"
      ? { slug: storeSlug, isDeleted: false }
      : {
          slug: storeSlug,
          tenantId: session.user.tenantId,
          isDeleted: false,
        };

  const store = (await Store.findOne(storeQuery).lean()) as {
    slug: string;
    name: string;
  } | null;

  if (!store) {
    redirect("/dashboard");
  }

  if (
    !canAccessStore(
      userRole,
      store.slug,
      session.user.storeSlug ?? undefined,
      session.user.stores
    )
  ) {
    redirect("/unauthorized");
  }

  return { session, store };
}

export async function requireStorePermission(
  storeSlug: string,
  pathname: string,
  permission?: Permission
) {
  const { session, store } = await requireStoreSession(storeSlug);

  const userRole = session.user.role as TenantRole;
  const permissions = getStoreAccessPermissions(session.user.stores, storeSlug);
  const isManager = isStoreManager(session.user.stores, storeSlug);

  if (permission && !hasPermission(userRole, permission, permissions, isManager)) {
    redirect("/unauthorized");
  }

  if (!canAccessStorePath(pathname, userRole, storeSlug, permissions, isManager)) {
    redirect("/unauthorized");
  }

  return { session, store };
}
