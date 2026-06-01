import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface ICustomerAddress {
  label?: string; // منزل، عمل، إلخ
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state?: string;
  country: string;
  zipCode?: string;
  isDefault: boolean;
}

export interface ICustomer extends Document {
  _id: mongoose.Types.ObjectId;
  storeId: mongoose.Types.ObjectId; // مرتبط بالمتجر
  name: string;
  email: string;
  password?: string;
  phone?: string;
  image?: string;
  emailVerified?: Date;
  isActive: boolean;
  addresses: ICustomerAddress[];
  wishlist: mongoose.Types.ObjectId[]; // قائمة المفضلة
  totalOrders: number;
  totalSpent: number;
  lastOrderAt?: Date;
  lastLoginAt?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  notes?: string; // ملاحظات عن العميل
  tags?: string[]; // وسوم للتصنيف
  createdAt: Date;
  updatedAt: Date;
}

const CustomerAddressSchema = new Schema<ICustomerAddress>(
  {
    label: { type: String, trim: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, trim: true },
    country: { type: String, required: true, trim: true, default: "EG" },
    zipCode: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const CustomerSchema = new Schema<ICustomer>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    phone: { type: String, trim: true },
    image: { type: String },
    emailVerified: { type: Date },
    isActive: { type: Boolean, default: true },
    addresses: [CustomerAddressSchema],
    wishlist: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    lastOrderAt: { type: Date },
    lastLoginAt: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    notes: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// فهرس مركب: بريد إلكتروني فريد داخل كل متجر
CustomerSchema.index({ storeId: 1, email: 1 }, { unique: true });
CustomerSchema.index({ storeId: 1, isActive: 1 });
CustomerSchema.index({ storeId: 1, createdAt: -1 });
CustomerSchema.index({ storeId: 1, totalOrders: -1 });
CustomerSchema.index({ storeId: 1, totalSpent: -1 });

const Customer: Model<ICustomer> =
  mongoose.models.Customer ?? mongoose.model<ICustomer>("Customer", CustomerSchema);

export default Customer;
