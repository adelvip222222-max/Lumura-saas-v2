// src/models/User.ts
import mongoose, { type Document, type Model, Schema } from "mongoose";
import type { StaffRole } from "@/lib/auth/permissions";

export interface IAddress {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  isDefault: boolean;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  // ✅ حقول الـ Multi-Tenant
  tenantId?: mongoose.Types.ObjectId;    // المستأجر (إذا كان المستخدم تابع لمتجر)
  storeId?: mongoose.Types.ObjectId;     // المتجر (إذا كان موظف أو عميل)
  storeSlug?: string;                    // آخر متجر دخول العميل منه
  storeName?: string;
  tenantSlug?: string;
  
  name: string;
  email: string;
  password?: string;
  image?: string;
  role: "super_admin" | "tenant_admin" | "store_admin" | "store_staff" | "customer";
  /** دور الموظف ضمن المتجر (3 أدوار ثابتة لكل مستأجر) */
  staffRole?: StaffRole;
  emailVerified?: Date;
  phone?: string;
  addresses: IAddress[];
  isActive: boolean;
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  createdAt: Date;
  updatedAt: Date;
  isLocked: boolean;
}

const AddressSchema = new Schema<IAddress>(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    zipCode: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const UserSchema = new Schema<IUser>(
  {
    // ✅ حقول الـ Multi-Tenant
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant" },
    storeId: { type: Schema.Types.ObjectId, ref: "Store" },
    storeSlug: { type: String, trim: true, lowercase: true },
    storeName: { type: String, trim: true },
    tenantSlug: { type: String, trim: true, lowercase: true },
    
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    image: { type: String },
    role: {
      type: String,
      enum: ["super_admin", "tenant_admin", "store_admin", "store_staff", "customer"],
      default: "customer",
    },
    staffRole: {
      type: String,
      enum: ["staff_member", "staff_orders", "staff_products", "staff_reports"],
    },
    emailVerified: { type: Date },
    phone: { type: String, trim: true },
    addresses: [AddressSchema],
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ✅ Indexes معدلة
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ tenantId: 1, role: 1 });
UserSchema.index({ storeId: 1, role: 1 });
UserSchema.index({ tenantId: 1, staffRole: 1 }, { unique: true, sparse: true });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdAt: -1 });

// Virtual: isLocked
UserSchema.virtual("isLocked").get(function (this: IUser) {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

// Remove password from JSON output
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.twoFactorSecret;
  return obj;
};

const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);

export default User;
