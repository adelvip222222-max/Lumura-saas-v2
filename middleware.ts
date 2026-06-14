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
  "/manifest.webmanifest",
  "/site.webmanifest",
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

const authMiddleware = auth((request) => {
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

export default async function middleware(request: NextRequest, event: any) {
  const response = await authMiddleware(request, event);
  if (response) {
    const contentSecurityPolicy = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://picsum.photos https://via.placeholder.com",
      "font-src 'self' data:",
      "connect-src 'self' https://api.stripe.com https://res.cloudinary.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; ");

    response.headers.set("Content-Security-Policy", contentSecurityPolicy);
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-DNS-Prefetch-Control", "off");
    response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
    response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|site.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
