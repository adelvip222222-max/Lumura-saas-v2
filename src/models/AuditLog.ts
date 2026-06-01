// src/models/AuditLog.ts
import mongoose, { type Document, type Model, Schema } from "mongoose";

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "LOGIN_FAILED"
  | "PASSWORD_CHANGE"
  | "ROLE_CHANGE"
  | "ORDER_STATUS_CHANGE"
  | "INVENTORY_UPDATE"
  | "EXPORT"
  | "IMPORT";

export interface IAuditLog extends Document {
  _id: mongoose.Types.ObjectId;
  // ✅ حقول الـ Multi-Tenant
  tenantId?: mongoose.Types.ObjectId;    // المستأجر (اختياري)
  storeId?: mongoose.Types.ObjectId;     // المتجر (اختياري)
  userId?: mongoose.Types.ObjectId;
  userEmail?: string;
  userRole?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    // ✅ حقول الـ Multi-Tenant
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant" },
    storeId: { type: Schema.Types.ObjectId, ref: "Store" },
    
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    userEmail: { type: String },
    userRole: { type: String },
    action: {
      type: String,
      required: true,
      enum: [
        "CREATE",
        "UPDATE",
        "DELETE",
        "LOGIN",
        "LOGOUT",
        "LOGIN_FAILED",
        "PASSWORD_CHANGE",
        "ROLE_CHANGE",
        "ORDER_STATUS_CHANGE",
        "INVENTORY_UPDATE",
        "EXPORT",
        "IMPORT",
      ],
    },
    resource: { type: String, required: true },
    resourceId: { type: String },
    details: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
    success: { type: Boolean, default: true },
    errorMessage: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// ✅ Indexes معدلة للـ Multi-Tenant
AuditLogSchema.index({ tenantId: 1, storeId: 1 });
AuditLogSchema.index({ storeId: 1, userId: 1 });
AuditLogSchema.index({ storeId: 1, action: 1 });
AuditLogSchema.index({ storeId: 1, resource: 1 });
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog ?? mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

export default AuditLog;
