// src/models/Supplier.ts
import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface ISupplier extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;     // ✅ المستأجر
  storeId: mongoose.Types.ObjectId;      // ✅ المتجر
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  contactPerson?: string;
  taxNumber?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: [true, "Tenant ID is required"],
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: [true, "Store ID is required"],
    },
    name: {
      type: String,
      required: [true, "Supplier name is required"],
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    country: { type: String, trim: true },
    contactPerson: { type: String, trim: true },
    taxNumber: { type: String, trim: true },
    notes: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ✅ Indexes معدلة
SupplierSchema.index({ tenantId: 1, storeId: 1, name: 1 });
SupplierSchema.index({ storeId: 1, isActive: 1 });
SupplierSchema.index({ storeId: 1 });

const Supplier: Model<ISupplier> =
  mongoose.models.Supplier ?? mongoose.model<ISupplier>("Supplier", SupplierSchema);

export default Supplier;
