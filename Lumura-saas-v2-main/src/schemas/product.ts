import { z } from "zod";

export const productImageSchema = z.object({
  url: z.string().url("Invalid image URL"),
  publicId: z.string().min(1),
  alt: z.string().optional(),
  isPrimary: z.boolean().default(false),
});

export const productSpecificationSchema = z.object({
  key: z.string().min(1, "Key is required").trim(),
  value: z.string().min(1, "Value is required").trim(),
});

export const productVariantSchema = z.object({
  name: z.string().min(1, "Variant name is required").trim(),
  options: z.array(z.string().min(1)).min(1, "At least one option required"),
});

export const createProductSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(200, "Name cannot exceed 200 characters")
    .trim(),
  nameAr: z.string().trim().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  descriptionAr: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  sku: z.string().min(1, "SKU is required").toUpperCase().trim(),
  barcode: z.string().trim().optional(),
  category: z.string().min(1, "Category is required"),
  subcategoryId: z.string().optional(),
  subcategoryName: z.string().optional(),
  brand: z.string().min(1, "Brand is required"),
  supplier: z.string().optional(),
  supplierName: z.string().optional(),
  // Pricing
  purchasePrice: z.coerce
    .number()
    .min(0, "Purchase price cannot be negative")
    .multipleOf(0.01),
  wholesalePrice: z.coerce
    .number()
    .min(0, "Wholesale price cannot be negative")
    .multipleOf(0.01),
  sellingPrice: z.coerce
    .number()
    .min(0.01, "Selling price must be greater than 0")
    .multipleOf(0.01),
  discountPrice: z.coerce.number().min(0).optional(),
  // Inventory
  stockQuantity: z.coerce
    .number()
    .int("Stock must be a whole number")
    .min(0, "Stock cannot be negative"),
  lowStockThreshold: z.coerce.number().int().min(0).default(10),
  unitType: z
    .enum(["piece", "kg", "gram", "liter", "meter", "box", "pack", "set", "pair"])
    .default("piece"),
  // Status
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  // Media
  images: z.array(productImageSchema).min(1, "At least one image is required"),
  thumbnail: z.string().optional(),
  // Content
  specifications: z.array(productSpecificationSchema).default([]),
  variants: z.array(productVariantSchema).default([]),
  tags: z.array(z.string().toLowerCase().trim()).default([]),
  // SEO
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  metaKeywords: z.array(z.string()).default([]),
});

export const updateProductSchema = createProductSchema.partial().extend({
  id: z.string().min(1, "Product ID is required"),
});

export const productFilterSchema = z.object({
  storeSlug: z.string().optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  featured: z.coerce.boolean().optional(),
  inStock: z.coerce.boolean().optional(),
  sortBy: z
    .enum(["price_asc", "price_desc", "newest", "oldest", "name_asc", "name_desc", "popular"])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
});

export const addReviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z
    .string()
    .min(10, "Review must be at least 10 characters")
    .max(1000, "Review cannot exceed 1000 characters")
    .trim(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductFilterInput = z.infer<typeof productFilterSchema>;
export type AddReviewInput = z.infer<typeof addReviewSchema>;
