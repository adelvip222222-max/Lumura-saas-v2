// src/models/Notification.ts
import mongoose, { type Document, type Model, Schema } from "mongoose";

export type NotificationType =
  | "subscription_expiring"
  | "subscription_expired"
  | "payment_success"
  | "payment_failed"
  | "payment_approved"
  | "payment_rejected"
  | "upgrade_success"
  | "limit_reached"
  | "store_suspended"
  | "store_activated"
  | "new_order"
  | "low_stock"
  | "order_status_updated"
  | "product_created"
  | "product_review_required"
  | "product_updated"
  | "product_deleted";

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  // ✅ حقول الـ Multi-Tenant
  tenantId: mongoose.Types.ObjectId;     // المستأجر
  storeId?: mongoose.Types.ObjectId;     // المتجر (اختياري)
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  isRead: boolean;
  link?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    // ✅ حقول الـ Multi-Tenant
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: [true, "Tenant ID is required"],
    },
    storeId: { type: Schema.Types.ObjectId, ref: "Store" },
    
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    titleAr: { type: String, required: true },
    message: { type: String, required: true },
    messageAr: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    link: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// ✅ Indexes معدلة
NotificationSchema.index({ tenantId: 1, storeId: 1, userId: 1, isRead: 1 });
NotificationSchema.index({ tenantId: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const Notification: Model<INotification> =
  mongoose.models.Notification ??
  mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
