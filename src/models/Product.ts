// src/models/Product.ts
import mongoose, { type Document, type Model, Schema } from "mongoose";
import type { UnitType } from "@/types";

export interface IProductImage {
  url: string;
  publicId: string;
  alt?: string;
  isPrimary: boolean;
}

export interface IProductSpecification {
  key: string;
  value: string;
}

export interface IProductVariant {
  name: string;
  options: string[];
}

export interface IProductReview {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  userImage?: string;
  rating: number;
  comment: string;
  isVerified: boolean;
  createdAt: Date;
}

// ✅ IProduct معرف مرة واحدة فقط
export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  
  // ✅ حقول الـ Multi-Tenant (مضافة)
  tenantId: mongoose.Types.ObjectId;     // المستأجر (صاحب المتجر)
  storeId: mongoose.Types.ObjectId;      // المتجر الذي ينتمي له المنتج
  
  // باقي الحقول
  name: string;
  nameAr?: string;
  slug: string;
  description: string;
  descriptionAr?: string;
  shortDescription?: string;
  sku: string;
  barcode?: string;
  category: mongoose.Types.ObjectId;
  subcategoryId?: string;
  subcategoryName?: string;
  brand: mongoose.Types.ObjectId;
  supplier?: mongoose.Types.ObjectId;
  supplierName?: string;
  
  // Pricing
  purchasePrice: number;
  wholesalePrice: number;
  sellingPrice: number;
  discountPrice?: number;
  discountPercent?: number;
  profitMargin: number;
  
  // Inventory
  stockQuantity: number;
  soldQuantity: number;
  remainingQuantity: number;
  lowStockThreshold: number;
  unitType: UnitType;
  
  // Status
  isFeatured: boolean;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  
  // Media
  images: IProductImage[];
  thumbnail?: string;
  
  // Content
  specifications: IProductSpecification[];
  variants: IProductVariant[];
  tags: string[];
  
  // Reviews
  reviews: IProductReview[];
  averageRating: number;
  reviewCount: number;
  
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const ProductImageSchema = new Schema<IProductImage>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    alt: { type: String },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false }
);

const ProductSpecificationSchema = new Schema<IProductSpecification>(
  {
    key: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const ProductVariantSchema = new Schema<IProductVariant>(
  {
    name: { type: String, required: true, trim: true },
    options: [{ type: String, trim: true }],
  },
  { _id: false }
);

const ProductReviewSchema = new Schema<IProductReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    userImage: { type: String },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true, _id: true }
);

const ProductSchema = new Schema<IProduct>(
  {
    // ✅ حقول الـ Multi-Tenant (مضافة)
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
    
    // باقي الحقول
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [200, "Name cannot exceed 200 characters"],
    },
    nameAr: { type: String, trim: true },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    descriptionAr: { type: String },
    shortDescription: { type: String, maxlength: 500 },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      uppercase: true,
      trim: true,
    },
    barcode: { type: String, trim: true },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    subcategoryId: { type: String },
    subcategoryName: { type: String },
    brand: {
      type: Schema.Types.ObjectId,
      ref: "Brand",
      required: [true, "Brand is required"],
    },
    supplier: { type: Schema.Types.ObjectId, ref: "Supplier" },
    supplierName: { type: String, trim: true },
    
    // Pricing
    purchasePrice: {
      type: Number,
      required: [true, "Purchase price is required"],
      min: [0, "Price cannot be negative"],
    },
    wholesalePrice: {
      type: Number,
      required: [true, "Wholesale price is required"],
      min: [0, "Price cannot be negative"],
    },
    sellingPrice: {
      type: Number,
      required: [true, "Selling price is required"],
      min: [0, "Price cannot be negative"],
    },
    discountPrice: { type: Number, min: 0 },
    discountPercent: { type: Number, min: 0, max: 100 },
    profitMargin: { type: Number, default: 0 },
    
    // Inventory
    stockQuantity: {
      type: Number,
      required: true,
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    soldQuantity: { type: Number, default: 0, min: 0 },
    remainingQuantity: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 10 },
    unitType: {
      type: String,
      enum: ["piece", "kg", "gram", "liter", "meter", "box", "pack", "set", "pair"],
      default: "piece",
    },
    
    // Status
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    
    // Media
    images: [ProductImageSchema],
    thumbnail: { type: String },
    
    // Content
    specifications: [ProductSpecificationSchema],
    variants: [ProductVariantSchema],
    tags: [{ type: String, lowercase: true, trim: true }],
    
    // Reviews
    reviews: [ProductReviewSchema],
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    
    // SEO
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
    metaKeywords: [{ type: String }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ✅ Indexes المعدلة للـ Multi-Tenant
ProductSchema.index({ tenantId: 1, storeId: 1, slug: 1 }, { unique: true });
ProductSchema.index({ tenantId: 1, storeId: 1, sku: 1 }, { unique: true });
ProductSchema.index({ storeId: 1, category: 1 });
ProductSchema.index({ storeId: 1, brand: 1 });
ProductSchema.index({ storeId: 1, isActive: 1, isDeleted: 1 });
ProductSchema.index({ storeId: 1, isFeatured: 1 });
ProductSchema.index({ storeId: 1, sellingPrice: 1 });
ProductSchema.index({ storeId: 1, stockQuantity: 1 });
ProductSchema.index({ storeId: 1, createdAt: -1 });
ProductSchema.index({ storeId: 1, soldQuantity: -1 });
ProductSchema.index({ storeId: 1, name: "text", description: "text", tags: "text" });

// Pre-save: calculate profit margin and remaining quantity
ProductSchema.pre("save", function (next) {
  if (this.sellingPrice && this.purchasePrice) {
    this.profitMargin =
      ((this.sellingPrice - this.purchasePrice) / this.sellingPrice) * 100;
  }
  this.remainingQuantity = this.stockQuantity - this.soldQuantity;
  next();
});

// Pre-save: calculate discount percent
ProductSchema.pre("save", function (next) {
  if (this.discountPrice && this.sellingPrice) {
    this.discountPercent =
      ((this.sellingPrice - this.discountPrice) / this.sellingPrice) * 100;
  }
  next();
});

const Product: Model<IProduct> =
  mongoose.models.Product ?? mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
