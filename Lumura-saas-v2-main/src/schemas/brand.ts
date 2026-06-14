import { z } from "zod";

export const createBrandSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").trim(),
  nameAr: z.string().trim().optional(),
  slug: z.string().min(2, "Slug is required").toLowerCase().trim(),
  description: z.string().optional(),
  logo: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).default(0),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
});

export const updateBrandSchema = createBrandSchema.partial().extend({
  id: z.string().min(1, "Brand ID is required"),
});

export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
