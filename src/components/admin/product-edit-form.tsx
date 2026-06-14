"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/admin/form-field";
import { updateProductSchema, type UpdateProductInput } from "@/schemas/product";
import { updateProductAction } from "@/actions/products";
import { getStoreCategoriesAction } from "@/actions/categories";
import { getStoreBrandsAction } from "@/actions/brands";
import { cn } from "@/lib/utils";
import type { ICategory } from "@/lib/db/models/Category";
import type { IBrand } from "@/lib/db/models/Brand";

const UNIT_TYPES = ["piece","kg","gram","liter","meter","box","pack","set","pair"] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ProductEditForm({ product }: { product: any }) {
  const router = useRouter();
  const storeSlug = product.storeSlug ?? product.store?.slug ?? "";
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [brands, setBrands] = useState<IBrand[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoryId =
    typeof product.category === "object" ? product.category._id : product.category;
  const brandId =
    typeof product.brand === "object" ? product.brand._id : product.brand;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<UpdateProductInput>({
    resolver: zodResolver(updateProductSchema),
    defaultValues: {
      id: product._id,
      name: product.name,
      nameAr: product.nameAr ?? "",
      description: product.description,
      shortDescription: product.shortDescription ?? "",
      sku: product.sku,
      barcode: product.barcode ?? "",
      category: categoryId,
      subcategoryId: product.subcategoryId ?? "",
      subcategoryName: product.subcategoryName ?? "",
      brand: brandId,
      supplierName: product.supplierName ?? "",
      purchasePrice: product.purchasePrice,
      wholesalePrice: product.wholesalePrice,
      sellingPrice: product.sellingPrice,
      discountPrice: product.discountPrice ?? undefined,
      stockQuantity: product.stockQuantity,
      lowStockThreshold: product.lowStockThreshold ?? 10,
      unitType: product.unitType ?? "piece",
      isFeatured: product.isFeatured,
      isActive: product.isActive,
      images: product.images ?? [],
      specifications: product.specifications ?? [],
      tags: product.tags ?? [],
      metaTitle: product.metaTitle ?? "",
      metaDescription: product.metaDescription ?? "",
    },
  });

  const { fields: specFields, append: appendSpec, remove: removeSpec } =
    useFieldArray({ control, name: "specifications" });
  const { fields: imageFields, append: appendImage, remove: removeImage } =
    useFieldArray({ control, name: "images" });

  const watchedPurchase = watch("purchasePrice") ?? 0;
  const watchedSelling  = watch("sellingPrice") ?? 0;
  const watchedTags     = watch("tags") ?? [];
  const watchedCategory = watch("category");

  const profitMargin =
    watchedSelling > 0
      ? (((watchedSelling - watchedPurchase) / watchedSelling) * 100).toFixed(1)
      : "0.0";

  const selectedCategory = categories.find(
    (c) => c._id.toString() === watchedCategory
  );

  useEffect(() => {
    getStoreCategoriesAction(storeSlug, false).then((r) => {
      if (r.success && r.data) setCategories(r.data as ICategory[]);
    });
    getStoreBrandsAction(storeSlug, false).then((r) => {
      if (r.success && r.data) setBrands(r.data as IBrand[]);
    });
  }, [storeSlug]);

  function handleAddTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !watchedTags.includes(t)) setValue("tags", [...watchedTags, t]);
    setTagInput("");
  }

  const onSubmit = async (data: UpdateProductInput) => {
    setIsSubmitting(true);
    try {
      const result = await updateProductAction(data);
      if (!result.success) {
        toast.error(result.error ?? "Failed to update product");
        return;
      }
      toast.success("Product updated successfully");
      router.push("/admin/products");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <input type="hidden" {...register("id")} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">

          <Card>
            <CardHeader><CardTitle className="text-base">Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Product Name" required error={errors.name?.message}>
                  <Input {...register("name")} />
                </FormField>
                <FormField label="Arabic Name" error={errors.nameAr?.message}>
                  <Input {...register("nameAr")} dir="rtl" />
                </FormField>
              </div>
              <FormField label="Description" required error={errors.description?.message}>
                <textarea
                  {...register("description")}
                  rows={4}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </FormField>
              <FormField label="Short Description">
                <textarea
                  {...register("shortDescription")}
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </FormField>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Pricing</CardTitle>
                <span className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  Number(profitMargin) >= 20
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                )}>
                  Margin: {profitMargin}%
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <FormField label="Purchase" required error={errors.purchasePrice?.message}>
                  <Input {...register("purchasePrice", { valueAsNumber: true })} type="number" step="0.01" min="0" />
                </FormField>
                <FormField label="Wholesale" required error={errors.wholesalePrice?.message}>
                  <Input {...register("wholesalePrice", { valueAsNumber: true })} type="number" step="0.01" min="0" />
                </FormField>
                <FormField label="Selling" required error={errors.sellingPrice?.message}>
                  <Input {...register("sellingPrice", { valueAsNumber: true })} type="number" step="0.01" min="0" />
                </FormField>
                <FormField label="Discount">
                  <Input {...register("discountPrice", { valueAsNumber: true })} type="number" step="0.01" min="0" />
                </FormField>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Inventory</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <FormField label="SKU" required error={errors.sku?.message}>
                  <Input {...register("sku")} className="uppercase" />
                </FormField>
                <FormField label="Barcode">
                  <Input {...register("barcode")} />
                </FormField>
                <FormField label="Stock Qty" required error={errors.stockQuantity?.message}>
                  <Input {...register("stockQuantity", { valueAsNumber: true })} type="number" min="0" />
                </FormField>
                <FormField label="Low Stock Alert">
                  <Input {...register("lowStockThreshold", { valueAsNumber: true })} type="number" min="0" />
                </FormField>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Images</CardTitle>
                <Button type="button" variant="outline" size="sm"
                  onClick={() => appendImage({ url: "", publicId: "", alt: "", isPrimary: imageFields.length === 0 })}>
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {imageFields.map((field, idx) => (
                <div key={field.id} className="flex items-start gap-3 rounded-lg border p-3">
                  <div className="flex-1 space-y-2">
                    <Input {...register(`images.${idx}.url`)} placeholder="Image URL" />
                    <div className="flex gap-2">
                      <Input {...register(`images.${idx}.publicId`)} placeholder="Public ID" className="flex-1" />
                      <Input {...register(`images.${idx}.alt`)} placeholder="Alt text" className="flex-1" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button type="button"
                      onClick={() => imageFields.forEach((_, i) => setValue(`images.${i}.isPrimary`, i === idx))}
                      className={cn("rounded-full p-1.5", watch(`images.${idx}.isPrimary`) ? "text-yellow-500" : "text-muted-foreground")}>
                      <Star className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => removeImage(idx)}
                      className="rounded-full p-1.5 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Specs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Specifications</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={() => appendSpec({ key: "", value: "" })}>
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {specFields.map((field, idx) => (
                <div key={field.id} className="flex items-center gap-2">
                  <Input {...register(`specifications.${idx}.key`)} placeholder="Key" className="flex-1" />
                  <Input {...register(`specifications.${idx}.value`)} placeholder="Value" className="flex-1" />
                  <button type="button" onClick={() => removeSpec(idx)}
                    className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader><CardTitle className="text-base">Tags</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(); } }}
                  placeholder="Add tag and press Enter" />
                <Button type="button" variant="outline" onClick={handleAddTag}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {watchedTags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs">
                    {tag}
                    <button type="button" onClick={() => setValue("tags", watchedTags.filter((t) => t !== tag))}
                      className="ml-1 hover:text-destructive">×</button>
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Status</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <label className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-muted/50">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">Visible in store</p>
                </div>
                <input type="checkbox" {...register("isActive")} className="h-4 w-4 accent-primary" />
              </label>
              <label className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-muted/50">
                <div>
                  <p className="text-sm font-medium">Featured</p>
                  <p className="text-xs text-muted-foreground">Show on homepage</p>
                </div>
                <input type="checkbox" {...register("isFeatured")} className="h-4 w-4 accent-primary" />
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Classification</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField label="Category" required error={errors.category?.message}>
                <select {...register("category")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="">Select...</option>
                  {categories.map((c) => (
                    <option key={c._id.toString()} value={c._id.toString()}>{c.name}</option>
                  ))}
                </select>
              </FormField>

              {selectedCategory && selectedCategory.subcategories.length > 0 && (
                <FormField label="Subcategory">
                  <select {...register("subcategoryId")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="">Select...</option>
                    {selectedCategory.subcategories.map((s) => (
                      <option key={s._id.toString()} value={s._id.toString()}>{s.name}</option>
                    ))}
                  </select>
                </FormField>
              )}

              <FormField label="Brand" required error={errors.brand?.message}>
                <select {...register("brand")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="">Select...</option>
                  {brands.map((b) => (
                    <option key={b._id.toString()} value={b._id.toString()}>{b.name}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Unit Type">
                <select {...register("unitType")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {UNIT_TYPES.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </FormField>

              <FormField label="Supplier Name">
                <Input {...register("supplierName")} />
              </FormField>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
            Save Changes
          </Button>
        </div>
      </div>
    </form>
  );
}
