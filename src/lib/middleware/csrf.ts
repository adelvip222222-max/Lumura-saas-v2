// src/lib/middleware/csrf.ts
import { cookies } from "next/headers";
import crypto from "crypto";

const CSRF_TOKEN_NAME = "csrf-token";
const CSRF_COOKIE_NAME = "__csrf-token";
const CSRF_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: 60 * 60 * 24, // 24 hours
};

/**
 * Generate a new CSRF token
 */
export const generateCsrfToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Set CSRF token in cookies
 */
export const setCsrfToken = async (token: string): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE_NAME, token, CSRF_COOKIE_OPTIONS);
};

/**
 * Get CSRF token from cookies
 */
export const getCsrfToken = async (): Promise<string | null> => {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(CSRF_COOKIE_NAME)?.value ?? null;
  } catch {
    return null;
  }
};

/**
 * Verify CSRF token from request
 * Token can come from:
 * 1. X-CSRF-Token header
 * 2. csrf-token form field
 * 3. Authorization Bearer token (skip CSRF for API calls)
 */
export const verifyCsrfToken = async (
  formToken: string | null,
  headerToken: string | null
): Promise<boolean> => {
  const cookieToken = await getCsrfToken();

  if (!cookieToken) {
    return false;
  }

  // Check if tokens match (compare all provided tokens)
  const providedToken = formToken || headerToken;

  if (!providedToken) {
    return false;
  }

  // Use constant-time comparison to prevent timing attacks
  return constantTimeCompare(cookieToken, providedToken);
};

/**
 * Constant-time string comparison (prevents timing attacks)
 */
const constantTimeCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
};

/**
 * Should skip CSRF check for this request?
 * Skip for: GET, HEAD, OPTIONS, API routes with Bearer token
 */
export const shouldSkipCsrfCheck = (method: string, hasAuthHeader: boolean): boolean => {
  // Skip for safe methods
  if (["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase())) {
    return true;
  }

  // Skip for API calls with Authorization header (they have their own security)
  if (hasAuthHeader) {
    return true;
  }

  return false;
};
