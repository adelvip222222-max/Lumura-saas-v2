// src/lib/audit/audit-logger.ts
import { connectToDatabase } from "@/lib/db/mongodb";
import AuditLog from "@/models/AuditLog";

export enum AuditAction {
  LOGIN = "LOGIN",
  LOGIN_FAILED = "LOGIN_FAILED",
  LOGOUT = "LOGOUT",
  REGISTER = "REGISTER",
  PASSWORD_CHANGE = "PASSWORD_CHANGE",
  EMAIL_VERIFIED = "EMAIL_VERIFIED",
  ROLE_CHANGE = "ROLE_CHANGE",
  STORE_CREATE = "STORE_CREATE",
  STORE_UPDATE = "STORE_UPDATE",
  STORE_DELETE = "STORE_DELETE",
  PRODUCT_CREATE = "PRODUCT_CREATE",
  PRODUCT_UPDATE = "PRODUCT_UPDATE",
  PRODUCT_DELETE = "PRODUCT_DELETE",
  ORDER_CREATE = "ORDER_CREATE",
  ORDER_UPDATE = "ORDER_UPDATE",
  ORDER_STATUS_CHANGE = "ORDER_STATUS_CHANGE",
  PAYMENT_RECEIVED = "PAYMENT_RECEIVED",
  INVENTORY_UPDATE = "INVENTORY_UPDATE",
  SETTINGS_UPDATE = "SETTINGS_UPDATE",
  USER_INVITED = "USER_INVITED",
  USER_REMOVED = "USER_REMOVED",
  EXPORT = "EXPORT",
  IMPORT = "IMPORT",
}

export interface AuditLogEntry {
  tenantId?: string;
  storeId?: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  method?: string;
  path?: string;
  ip?: string;
  userAgent?: string;
  status: "success" | "failure";
  details?: Record<string, unknown>;
  error?: string;
  timestamp?: Date;
}

/**
 * Log an audit action
 */
export const auditLog = async (entry: AuditLogEntry): Promise<void> => {
  try {
    await connectToDatabase();

    await AuditLog.create({
      tenantId: entry.tenantId,
      storeId: entry.storeId,
      userId: entry.userId,
      userEmail: entry.userEmail,
      userRole: entry.userRole,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      method: entry.method,
      path: entry.path,
      ip: entry.ip,
      userAgent: entry.userAgent,
      status: entry.status,
      details: entry.details || {},
      error: entry.error,
      timestamp: entry.timestamp || new Date(),
    });

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      const status = entry.status === "success" ? "✅" : "❌";
      console.log(
        `[AUDIT] ${status} ${entry.action} - ${entry.userEmail || "system"} - ${entry.resource}`
      );
    }
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
};

/**
 * Get recent audit logs for a tenant
 */
export const getAuditLogs = async (
  tenantId: string,
  limit: number = 50,
  offset: number = 0
) => {
  try {
    await connectToDatabase();

    const logs = await AuditLog.find({ tenantId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    const total = await AuditLog.countDocuments({ tenantId });

    return { logs, total };
  } catch (error) {
    console.error("Failed to get audit logs:", error);
    return { logs: [], total: 0 };
  }
};

/**
 * Get audit logs for a specific store
 */
export const getStoreAuditLogs = async (
  storeId: string,
  limit: number = 50,
  offset: number = 0
) => {
  try {
    await connectToDatabase();

    const logs = await AuditLog.find({ storeId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    const total = await AuditLog.countDocuments({ storeId });

    return { logs, total };
  } catch (error) {
    console.error("Failed to get store audit logs:", error);
    return { logs: [], total: 0 };
  }
};

/**
 * Delete old audit logs (older than 90 days)
 * Should be called by a cron job
 */
export const cleanupOldAuditLogs = async (): Promise<void> => {
  try {
    await connectToDatabase();

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const result = await AuditLog.deleteMany({
      timestamp: { $lt: ninetyDaysAgo },
    });

    console.log(`Deleted ${result.deletedCount} old audit logs`);
  } catch (error) {
    console.error("Failed to cleanup audit logs:", error);
  }
};
