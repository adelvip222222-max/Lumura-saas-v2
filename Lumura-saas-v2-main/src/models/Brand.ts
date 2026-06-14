// src/models/Brand.ts
import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IBrand extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;     // ✅ المستأجر
  storeId: mongoose.Types.ObjectId;      // ✅ المتجر
  name: string;
  nameAr?: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BrandSchema = new Schema<IBrand>(
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
      required: [true, "Brand name is required"],
      trim: true,
    },
    nameAr: { type: String, trim: true },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    description: { type: String, trim: true },
    logo: { type: String },
    website: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
  },
  { timestamps: true }
);

// ✅ Indexes معدلة
BrandSchema.index({ tenantId: 1, storeId: 1, slug: 1 }, { unique: true });
BrandSchema.index({ storeId: 1, isActive: 1 });
BrandSchema.index({ storeId: 1, isFeatured: 1 });
BrandSchema.index({ storeId: 1, sortOrder: 1 });

const Brand: Model<IBrand> =
  mongoose.models.Brand ?? mongoose.model<IBrand>("Brand", BrandSchema);

export default Brand;
