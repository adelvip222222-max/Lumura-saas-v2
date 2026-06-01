// src/models/Category.ts
import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface ISubcategory {
  _id: mongoose.Types.ObjectId;
  name: string;
  nameAr?: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface ICategory extends Document {
  _id: mongoose.Types.ObjectId;
  // ✅ حقول الـ Multi-Tenant
  tenantId: mongoose.Types.ObjectId;     // المستأجر
  storeId: mongoose.Types.ObjectId;      // المتجر
  name: string;
  nameAr?: string;
  slug: string;
  description?: string;
  descriptionAr?: string;
  image?: string;
  icon?: string;
  subcategories: ISubcategory[];
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubcategorySchema = new Schema<ISubcategory>(
  {
    name: { type: String, required: true, trim: true },
    nameAr: { type: String, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    description: { type: String, trim: true },
    image: { type: String },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: true }
);

const CategorySchema = new Schema<ICategory>(
  {
    // ✅ حقول الـ Multi-Tenant
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
      required: [true, "Category name is required"],
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
    descriptionAr: { type: String, trim: true },
    image: { type: String },
    icon: { type: String },
    subcategories: [SubcategorySchema],
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
  },
  { timestamps: true }
);

// ✅ Indexes معدلة للـ Multi-Tenant
CategorySchema.index({ tenantId: 1, storeId: 1, slug: 1 }, { unique: true });
CategorySchema.index({ storeId: 1, isActive: 1 });
CategorySchema.index({ storeId: 1, isFeatured: 1 });
CategorySchema.index({ storeId: 1, sortOrder: 1 });

const Category: Model<ICategory> =
  mongoose.models.Category ?? mongoose.model<ICategory>("Category", CategorySchema);

export default Category;
