// src/models/Tenant.ts
import mongoose, { type Document, Schema } from "mongoose";

import { type TenantRole, type AdminPermission } from "@/lib/auth/permissions";

export interface IStaffStoreAccess {
  storeId: mongoose.Types.ObjectId;
  storeSlug: string;
  storeName: string;
  permissions: AdminPermission[];
  isManager: boolean;
}

export interface ITenant extends Document {
  _id: mongoose.Types.ObjectId;
  slug: string;
  name: string;
  email: string;
  password: string;
  role: TenantRole;
  prgType: "tenant" | "staff";
  phone?: string;
  logo?: string;
  logoPublicId?: string;
  storeId?: mongoose.Types.ObjectId;
  storeSlug?: string;
  storeName?: string;
  tenantId?: mongoose.Types.ObjectId;
  staffAccess?: IStaffStoreAccess[];
  plan: "MONTHLY" | "SEMI_ANNUAL" | "YEARLY";
  status: "PENDING" | "ACTIVE" | "SUSPENDED" | "EXPIRED";
  subscriptionStart: Date;
  subscriptionEnd: Date;
  maxStores: number;
  maxProducts: number;
  maxStaff: number;
  isActive: boolean;
  permissions?: AdminPermission[];
  settings?: {
    language: string;
    timezone: string;
    dateFormat: string;
    notifications: {
      email: boolean;
      sms: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const StaffStoreAccessSchema = new Schema<IStaffStoreAccess>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
    storeSlug: { type: String, required: true, lowercase: true, trim: true },
    storeName: { type: String, required: true, trim: true },
    permissions: [{ type: String }],
    isManager: { type: Boolean, default: false },
  },
  { _id: false }
);

const TenantSchema = new Schema<ITenant>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: [
        "super_admin",
        "tenant_admin",
        "staff_member",
        "staff_orders",
        "staff_products",
        "staff_reports",
      ],
      default: "tenant_admin",
      required: true,
    },
    prgType: {
      type: String,
      enum: ["tenant", "staff"],
      default: "tenant",
      required: true,
    },
    phone: { type: String, trim: true },
    logo: { type: String },
    logoPublicId: { type: String },

    storeId: { type: Schema.Types.ObjectId, ref: "Store" },
    storeSlug: { type: String },
    storeName: { type: String },

    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant" },

    staffAccess: [StaffStoreAccessSchema],

    plan: {
      type: String,
      enum: ["MONTHLY", "SEMI_ANNUAL", "YEARLY"],
      default: "MONTHLY",
    },
    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "SUSPENDED", "EXPIRED"],
      default: "PENDING",
    },
    subscriptionStart: { type: Date, default: Date.now },
    subscriptionEnd: { type: Date },

    maxStores: { type: Number, default: 1 },
    maxProducts: { type: Number, default: 100 },

    // تم تعديلها من 3 إلى 4
    maxStaff: { type: Number, default: 4 },

    isActive: { type: Boolean, default: true },

    permissions: [{ type: String }],

    settings: {
      language: { type: String, default: "ar" },
      timezone: { type: String, default: "Africa/Cairo" },
      dateFormat: { type: String, default: "DD/MM/YYYY" },
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
      },
    },
  },
  { timestamps: true }
);

TenantSchema.index({ email: 1 });
TenantSchema.index({ status: 1 });
TenantSchema.index({ role: 1 });
TenantSchema.index({ storeId: 1, role: 1 });
TenantSchema.index({ tenantId: 1, role: 1 });
TenantSchema.index({ tenantId: 1, "staffAccess.storeSlug": 1 });

TenantSchema.virtual("isSubscriptionActive").get(function (this: ITenant) {
  return this.subscriptionEnd && this.subscriptionEnd > new Date();
});

TenantSchema.pre("save", function (next) {
  if (
    this.subscriptionEnd &&
    this.subscriptionEnd < new Date() &&
    this.status === "ACTIVE"
  ) {
    this.status = "EXPIRED";
  }

  next();
});

TenantSchema.pre("validate", function (next) {
  const staffRoles: TenantRole[] = [
    "staff_member",
    "staff_orders",
    "staff_products",
    "staff_reports",
  ];

  if (staffRoles.includes(this.role)) {
    this.prgType = "staff";
    if (!this.subscriptionEnd) this.subscriptionEnd = new Date();
  } else if (this.role === "tenant_admin") {
    this.prgType = "tenant";
  }

  next();
});

export default mongoose.models.Tenant ||
  mongoose.model<ITenant>("Tenant", TenantSchema);