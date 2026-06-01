// src/middleware.ts
import { auth } from "@/lib/auth";
import {
  canAccessStore,
  canAccessStorePath,
  getDefaultRedirect,
  getStoreAccessPermissions,
  isStoreManager,
  isStaffRole,
  type Permission,
  type TenantRole,
} from "@/lib/auth/permissions";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/verify",
  "/forgot-password",
  "/reset-password",
  "/unauthorized",
  "/api/auth",
];

const AUTH_PAGES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

type AuthRequest = NextRequest & {
  auth?: {
    user?: {
      role?: TenantRole;
      prgType?: "tenant" | "staff";
      storeSlug?: string | null;
      stores?: Array<{
        slug: string;
        permissions?: Permission[];
        isManager?: boolean;
      }>;
      permissions?: Permission[];
    };
  } | null;
};

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function isAuthPage(pathname: string) {
  return AUTH_PAGES.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function nextWithPath(request: NextRequest, pathname: string) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export default auth((request) => {
  const authRequest = request as AuthRequest;
  const pathname = request.nextUrl.pathname;
  const user = authRequest.auth?.user;

  if (isPublicPath(pathname)) {
    if (user?.role && isAuthPage(pathname)) {
      const defaultStore = user.stores?.[0]?.slug ?? user.storeSlug ?? undefined;
      const defaultPermissions = defaultStore
        ? getStoreAccessPermissions(user.stores, defaultStore)
        : user.permissions ?? [];
      return NextResponse.redirect(
        new URL(
          getDefaultRedirect(
            user.role,
            defaultStore,
            defaultPermissions,
            defaultStore ? isStoreManager(user.stores, defaultStore) : false
          ),
          request.url
        )
      );
    }

    return nextWithPath(request, pathname);
  }

  if (pathname === "/") {
    return nextWithPath(request, pathname);
  }

  const isAdministrationPath =
    pathname === "/ad-i" ||
    pathname.startsWith("/ad-i-");
  const isProtectedPath =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/super-admin") ||
    isAdministrationPath;

  if (!user?.role && isProtectedPath) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!user?.role) {
    return nextWithPath(request, pathname);
  }

  const userRole = user.role;
  const userStoreSlug = user.storeSlug ?? user.stores?.[0]?.slug ?? undefined;
  const userStorePermissions = userStoreSlug
    ? getStoreAccessPermissions(user.stores, userStoreSlug)
    : user.permissions ?? [];

  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    if (user.prgType === "staff" || isStaffRole(userRole)) {
      return NextResponse.redirect(
        new URL(
          getDefaultRedirect(
            userRole,
            userStoreSlug,
            userStorePermissions,
            userStoreSlug ? isStoreManager(user.stores, userStoreSlug) : false
          ),
          request.url
        )
      );
    }

    return NextResponse.redirect(
      new URL(
        getDefaultRedirect(
          userRole,
          userStoreSlug,
          userStorePermissions,
          userStoreSlug ? isStoreManager(user.stores, userStoreSlug) : false
        ),
        request.url
      )
    );
  }

  if (isAdministrationPath) {
    if (userRole === "super_admin") {
      return NextResponse.redirect(new URL("/super-admin", request.url));
    }

    if (!userStoreSlug) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    return nextWithPath(request, pathname);
  }

  if (pathname.startsWith("/super-admin")) {
    return userRole === "super_admin"
      ? nextWithPath(request, pathname)
      : NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  if (pathname.startsWith("/dashboard")) {
    if (userRole === "super_admin") {
      return NextResponse.redirect(new URL("/super-admin", request.url));
    }

    const storeMatch = pathname.match(/^\/dashboard\/stores\/([^/]+)(?:\/.*)?$/);
    if (!storeMatch) {
      return userRole === "tenant_admin"
        ? nextWithPath(request, pathname)
        : NextResponse.redirect(
            new URL(
              getDefaultRedirect(
                userRole,
                userStoreSlug,
                userStorePermissions,
                userStoreSlug ? isStoreManager(user.stores, userStoreSlug) : false
              ),
              request.url
            )
          );
    }

    const requestedStoreSlug = storeMatch[1];
    const storeRootPath = `/dashboard/stores/${requestedStoreSlug}`;
    const requestedPermissions = getStoreAccessPermissions(user.stores, requestedStoreSlug);
    const requestedIsManager = isStoreManager(user.stores, requestedStoreSlug);

    if (!canAccessStore(userRole, requestedStoreSlug, userStoreSlug, user.stores)) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    if (
      isStaffRole(userRole) &&
      (pathname === storeRootPath || pathname === `${storeRootPath}/`)
    ) {
      const targetPath = getDefaultRedirect(
        userRole,
        requestedStoreSlug,
        requestedPermissions,
        requestedIsManager
      );

      if (targetPath !== pathname && targetPath !== `${pathname}/`) {
        return NextResponse.redirect(new URL(targetPath, request.url));
      }
    }

    if (
      isStaffRole(userRole) &&
      !canAccessStorePath(
        pathname,
        userRole,
        requestedStoreSlug,
        requestedPermissions,
        requestedIsManager
      )
    ) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    return nextWithPath(request, pathname);
  }

  return nextWithPath(request, pathname);
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
