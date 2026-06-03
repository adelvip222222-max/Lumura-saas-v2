// src/lib/middleware/request-logger.ts
import { connectToDatabase } from "@/lib/db/mongodb";
import AuditLog from "@/models/AuditLog";

export interface RequestLogData {
  userEmail?: string;
  userId?: string;
  userRole?: string;
  tenantId?: string;
  storeId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  method: string;
  path: string;
  ip: string;
  userAgent: string;
  status: "success" | "failure";
  details?: Record<string, unknown>;
  error?: string;
}

/**
 * Log an authentication-related request
 */
export const logAuthRequest = async (data: RequestLogData): Promise<void> => {
  try {
    await connectToDatabase();

    await AuditLog.create({
      tenantId: data.tenantId,
      storeId: data.storeId,
      userId: data.userId,
      userEmail: data.userEmail,
      userRole: data.userRole,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId,
      method: data.method,
      path: data.path,
      ip: data.ip,
      userAgent: data.userAgent,
      status: data.status,
      details: data.details || {},
      error: data.error,
      timestamp: new Date(),
    });
  } catch (error) {
    // Log to console but don't throw - audit logging should not break the app
    console.error("Failed to log auth request:", error);
  }
};

/**
 * Extract IP address from request headers
 */
export const getClientIp = (headers: Record<string, string | string[]>): string => {
  // Check for IP from various proxy headers
  const forwarded = headers["x-forwarded-for"];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ips.split(",")[0].trim();
  }

  const clientIp = headers["x-client-ip"];
  if (clientIp) {
    return Array.isArray(clientIp) ? clientIp[0] : clientIp;
  }

  const realIp = headers["x-real-ip"];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  return "unknown";
};

/**
 * Get user agent from headers
 */
export const getUserAgent = (headers: Record<string, string | string[]>): string => {
  const ua = headers["user-agent"];
  return Array.isArray(ua) ? ua[0] : ua || "unknown";
};

/**
 * Format log data for console output (development)
 */
export const formatLogEntry = (data: RequestLogData): string => {
  const timestamp = new Date().toISOString();
  const status = data.status === "success" ? "✅" : "❌";
  const user = data.userEmail || "anonymous";

  return `[${timestamp}] ${status} ${data.action} - ${user} (${data.ip}) - ${data.path}${
    data.error ? ` - Error: ${data.error}` : ""
  }`;
};

/**
 * Check if account should be locked (too many failed attempts)
 */
export const shouldLockAccount = async (email: string): Promise<boolean> => {
  try {
    await connectToDatabase();

    // Get failed login attempts in the last 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const failedAttempts = await AuditLog.countDocuments({
      userEmail: email.toLowerCase(),
      action: "LOGIN_FAILED",
      status: "failure",
      timestamp: { $gte: fifteenMinutesAgo },
    });

    // Lock after 3 failed attempts
    return failedAttempts >= 3;
  } catch (error) {
    console.error("Error checking account lock status:", error);
    return false;
  }
};

/**
 * Get remaining lockout time for an account
 */
export const getLockoutTimeRemaining = async (email: string): Promise<number> => {
  try {
    await connectToDatabase();

    // Get the most recent failed login attempt
    const lastFailedAttempt = await AuditLog.findOne({
      userEmail: email.toLowerCase(),
      action: "LOGIN_FAILED",
      status: "failure",
    })
      .sort({ timestamp: -1 })
      .lean();

    if (!lastFailedAttempt) {
      return 0;
    }

    // Lockout period is 30 minutes
    const lockoutPeriod = 30 * 60 * 1000;
    const timeSinceLastAttempt = Date.now() - new Date(lastFailedAttempt.timestamp).getTime();
    const remainingTime = Math.max(0, lockoutPeriod - timeSinceLastAttempt);

    return Math.ceil(remainingTime / 1000); // Return in seconds
  } catch (error) {
    console.error("Error getting lockout time:", error);
    return 0;
  }
};
