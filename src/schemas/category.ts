import { z } from "zod";

export const subcategorySchema = z.object({
  name: z.string().min(2, "Name is required").trim(),
  nameAr: z.string().trim().optional(),
  slug: z.string().min(2).toLowerCase().trim(),
  description: z.string().optional(),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const createCategorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").trim(),
  nameAr: z.string().trim().optional(),
  slug: z.string().min(2, "Slug is required").toLowerCase().trim(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  image: z.string().optional(),
  icon: z.string().optional(),
  subcategories: z.array(subcategorySchema).default([]),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).default(0),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  id: z.string().min(1, "Category ID is required"),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
