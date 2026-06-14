"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2, RefreshCw, ArrowLeft, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/admin/form-field";
import { PageHeader } from "@/components/admin/page-header";
import { updateProductSchema, type UpdateProductInput } from "@/schemas/product";
import { updateProductAction } from "@/actions/products";
import { getStoreCategoriesAction } from "@/actions/categories";
import { getStoreBrandsAction } from "@/actions/brands";
import type { ICategory } from "@/lib/db/models/Category";
import type { IBrand } from "@/lib/db/models/Brand";
import type { IProduct } from "@/lib/db/models/Product";
import { cn } from "@/lib/utils";

const UNIT_TYPES = [
  { value: "piece", label: "Piece" },
  { value: "kg", label: "Kilogram (kg)" },
  { value: "gram", label: "Gram" },
  { value: "liter", label: "Liter" },
  { value: "meter", label: "Meter" },
  { value: "box", label: "Box" },
  { value: "pack", label: "Pack" },
  { value: "set", label: "Set" },
  { value: "pair", label: "Pair" },
] as const;

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

interface ProductEditFormProps {
  product: IProduct;
  storeSlug: string;
}

export function ProductEditForm({ product, storeSlug }: ProductEditFormProps) {
  const router = useRouter();
  const productsPath = `/dashboard/stores/${storeSlug}/products`;
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [brands, setBrands] = useState<IBrand[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const rawCategory = product.category as unknown as
    | string
    | { _id?: { toString?: () => string } }
    | null
    | undefined;
  const categoryId =
    rawCategory && typeof rawCategory === "object" && "_id" in rawCategory
      ? rawCategory._id?.toString?.() ?? ""
      : rawCategory?.toString?.() ?? "";

  const rawBrand = product.brand as unknown as
    | string
    | { _id?: { toString?: () => string } }
    | null
    | undefined;
  const brandId =
    rawBrand && typeof rawBrand === "object" && "_id" in rawBrand
      ? rawBrand._id?.toString?.() ?? ""
      : rawBrand?.toString?.() ?? "";

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
      id: product._id.toString(),
      name: product.name,
      description: product.description,
      shortDescription: product.shortDescription ?? "",
      sku: product.sku,
      barcode: product.barcode ?? "",
      category: categoryId,
      subcategoryId: product.subcategoryId ?? "",
      subcategoryName: product.subcategoryName ?? "",
      brand: brandId,
      purchasePrice: product.purchasePrice,
      wholesalePrice: product.wholesalePrice,
      sellingPrice: product.sellingPrice,
      discountPrice: product.discountPrice ?? undefined,
      stockQuantity: product.stockQuantity,
      lowStockThreshold: product.lowStockThreshold,
      unitType: product.unitType,
      isFeatured: product.isFeatured,
      isActive: product.isActive,
      images: product.images ?? [],
      specifications: product.specifications ?? [],
      tags: product.tags ?? [],
      variants: product.variants ?? [],
      metaTitle: product.metaTitle ?? "",
      metaDescription: product.metaDescription ?? "",
      metaKeywords: product.metaKeywords ?? [],
    },
  });

  const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({
    control,
    name: "images",
  });

  const { fields: specFields, append: appendSpec, remove: removeSpec } = useFieldArray({
    control,
    name: "specifications",
  });

  const watchedCategory = watch("category");
  const watchedPurchasePrice = watch("purchasePrice");
  const watchedSellingPrice = watch("sellingPrice");
  const watchedTags = watch("tags");

  const selectedCategory = categories.find((c) => c._id.toString() === watchedCategory);

  const profitMargin =
    watchedSellingPrice && watchedSellingPrice > 0 && watchedPurchasePrice !== undefined
      ? (((watchedSellingPrice - watchedPurchasePrice) / watchedSellingPrice) * 100).toFixed(1)
      : null;

  useEffect(() => {
    async function loadData() {
      const [catResult, brandResult] = await Promise.all([
        getStoreCategoriesAction(storeSlug, false),
        getStoreBrandsAction(storeSlug, false),
      ]);
      if (catResult.success && catResult.data) setCategories(catResult.data as ICategory[]);
      if (brandResult.success && brandResult.data) setBrands(brandResult.data as IBrand[]);
    }
    void loadData();
  }, []);

  const addTag = useCallback(() => {
    const tag = tagInput.trim().toLowerCase();
    if (!tag) return;
    const current = watchedTags ?? [];
    if (!current.includes(tag)) {
      setValue("tags", [...current, tag]);
    }
    setTagInput("");
  }, [tagInput, watchedTags, setValue]);

  const removeTag = useCallback(
    (tag: string) => {
      setValue(
        "tags",
        (watchedTags ?? []).filter((t) => t !== tag)
      );
    },
    [watchedTags, setValue]
  );

  const onSubmit = async (data: UpdateProductInput) => {
    setIsLoading(true);
    try {
      const result = await updateProductAction(data);
      if (result.success) {
        toast.success("Product updated successfully");
        router.push(productsPath);
      } else {
        toast.error(result.error ?? "Failed to update product");
        if (result.errors) {
          Object.entries(result.errors).forEach(([, msgs]) => {
            if (msgs[0]) toast.error(msgs[0]);
          });
        }
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title={`Edit: ${product.name}`}
        description={`SKU: ${product.sku}`}
      >
        <Button >
          <Link href={productsPath}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <input type="hidden" {...register("id")} />

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Product Name" required error={errors.name?.message} htmlFor="name">
              <Input
                id="name"
                {...register("name")}
                error={errors.name?.message}
              />
            </FormField>

            <FormField
              label="Description"
              required
              error={errors.description?.message}
              htmlFor="description"
              className="sm:col-span-2"
            >
              <textarea
                id="description"
                rows={4}
                className={cn(
                  "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
                  errors.description && "border-destructive focus-visible:ring-destructive"
                )}
                {...register("description")}
              />
            </FormField>

            <FormField
              label="Short Description"
              error={errors.shortDescription?.message}
              htmlFor="shortDescription"
              className="sm:col-span-2"
            >
              <textarea
                id="shortDescription"
                rows={2}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                {...register("shortDescription")}
              />
            </FormField>
          </CardContent>
        </Card>

        {/* SKU & Barcode */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Identification</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="SKU" required error={errors.sku?.message} htmlFor="sku">
              <Input
                id="sku"
                className="uppercase"
                {...register("sku")}
                error={errors.sku?.message}
              />
            </FormField>

            <FormField label="Barcode" error={errors.barcode?.message} htmlFor="barcode">
              <Input
                id="barcode"
                {...register("barcode")}
                error={errors.barcode?.message}
              />
            </FormField>
          </CardContent>
        </Card>

        {/* Category & Brand */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category & Brand</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Category" required error={errors.category?.message} htmlFor="category">
              <select
                id="category"
                className={cn(selectClass, errors.category && "border-destructive")}
                {...register("category")}
                onChange={(e) => {
                  register("category").onChange(e);
                  setValue("subcategoryId", "");
                  setValue("subcategoryName", "");
                }}
              >
                <option value="">Select category...</option>
                {categories.map((cat) => (
                  <option key={cat._id.toString()} value={cat._id.toString()}>
                    {cat.icon ? `${cat.icon} ` : ""}{cat.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Subcategory" error={errors.subcategoryId?.message} htmlFor="subcategoryId">
              <select
                id="subcategoryId"
                className={selectClass}
                disabled={!selectedCategory || selectedCategory.subcategories.length === 0}
                {...register("subcategoryId")}
                onChange={(e) => {
                  register("subcategoryId").onChange(e);
                  const sub = selectedCategory?.subcategories.find(
                    (s) => s._id.toString() === e.target.value
                  );
                  setValue("subcategoryName", sub?.name ?? "");
                }}
              >
                <option value="">Select subcategory...</option>
                {selectedCategory?.subcategories
                  .filter((s) => s.isActive)
                  .map((sub) => (
                    <option key={sub._id.toString()} value={sub._id.toString()}>
                      {sub.name}
                    </option>
                  ))}
              </select>
            </FormField>

            <FormField label="Brand" required error={errors.brand?.message} htmlFor="brand">
              <select
                id="brand"
                className={cn(selectClass, errors.brand && "border-destructive")}
                {...register("brand")}
              >
                <option value="">Select brand...</option>
                {brands.map((brand) => (
                  <option key={brand._id.toString()} value={brand._id.toString()}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Unit Type" required error={errors.unitType?.message} htmlFor="unitType">
              <select id="unitType" className={selectClass} {...register("unitType")}>
                {UNIT_TYPES.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </FormField>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FormField label="Purchase Price" required error={errors.purchasePrice?.message} htmlFor="purchasePrice">
                <Input
                  id="purchasePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("purchasePrice")}
                  error={errors.purchasePrice?.message}
                />
              </FormField>

              <FormField label="Wholesale Price" required error={errors.wholesalePrice?.message} htmlFor="wholesalePrice">
                <Input
                  id="wholesalePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("wholesalePrice")}
                  error={errors.wholesalePrice?.message}
                />
              </FormField>

              <FormField label="Selling Price" required error={errors.sellingPrice?.message} htmlFor="sellingPrice">
                <Input
                  id="sellingPrice"
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...register("sellingPrice")}
                  error={errors.sellingPrice?.message}
                />
              </FormField>

              <FormField label="Discount Price" error={errors.discountPrice?.message} htmlFor="discountPrice">
                <Input
                  id="discountPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("discountPrice")}
                  error={errors.discountPrice?.message}
                />
              </FormField>
            </div>

            {profitMargin !== null && (
              <div className="rounded-md bg-muted/50 px-4 py-3 text-sm">
                <span className="text-muted-foreground">Profit Margin: </span>
                <span
                  className={cn(
                    "font-semibold",
                    Number(profitMargin) >= 20
                      ? "text-green-600"
                      : Number(profitMargin) >= 10
                        ? "text-yellow-600"
                        : "text-destructive"
                  )}
                >
                  {profitMargin}%
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inventory */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inventory</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Stock Quantity" required error={errors.stockQuantity?.message} htmlFor="stockQuantity">
              <Input
                id="stockQuantity"
                type="number"
                min="0"
                step="1"
                {...register("stockQuantity")}
                error={errors.stockQuantity?.message}
              />
            </FormField>

            <FormField
              label="Low Stock Threshold"
              error={errors.lowStockThreshold?.message}
              htmlFor="lowStockThreshold"
              hint="Alert when stock falls below this number"
            >
              <Input
                id="lowStockThreshold"
                type="number"
                min="0"
                step="1"
                {...register("lowStockThreshold")}
                error={errors.lowStockThreshold?.message}
              />
            </FormField>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Images</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendImage({ url: "", publicId: "", alt: "", isPrimary: imageFields.length === 0 })
                }
              >
                <Plus className="h-4 w-4" />
                Add Image
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {imageFields.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No images. Click &quot;Add Image&quot; to add product images.
              </p>
            )}
            {imageFields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-3 rounded-md border p-3">
                <div className="flex-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <FormField
                    label="Image URL"
                    required
                    error={errors.images?.[index]?.url?.message}
                    htmlFor={`images.${index}.url`}
                  >
                    <Input
                      id={`images.${index}.url`}
                      placeholder="https://example.com/image.jpg"
                      {...register(`images.${index}.url`)}
                      error={errors.images?.[index]?.url?.message}
                    />
                  </FormField>
                  <FormField
                    label="Public ID"
                    required
                    error={errors.images?.[index]?.publicId?.message}
                    htmlFor={`images.${index}.publicId`}
                  >
                    <Input
                      id={`images.${index}.publicId`}
                      placeholder="products/image-name"
                      {...register(`images.${index}.publicId`)}
                      error={errors.images?.[index]?.publicId?.message}
                    />
                  </FormField>
                  <FormField
                    label="Alt Text"
                    error={errors.images?.[index]?.alt?.message}
                    htmlFor={`images.${index}.alt`}
                  >
                    <Input
                      id={`images.${index}.alt`}
                      placeholder="Image description"
                      {...register(`images.${index}.alt`)}
                    />
                  </FormField>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id={`images.${index}.isPrimary`}
                      className="h-4 w-4 rounded border-input"
                      {...register(`images.${index}.isPrimary`)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          imageFields.forEach((_, i) => {
                            if (i !== index) setValue(`images.${i}.isPrimary`, false);
                          });
                        }
                        register(`images.${index}.isPrimary`).onChange(e);
                      }}
                    />
                    <label htmlFor={`images.${index}.isPrimary`} className="text-sm font-medium">
                      Primary image
                    </label>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive shrink-0"
                  onClick={() => removeImage(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Specifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Specifications</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendSpec({ key: "", value: "" })}
              >
                <Plus className="h-4 w-4" />
                Add Spec
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {specFields.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No specifications added.
              </p>
            )}
            {specFields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-3">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Key (e.g. Color)"
                    {...register(`specifications.${index}.key`)}
                    error={errors.specifications?.[index]?.key?.message}
                  />
                  <Input
                    placeholder="Value (e.g. Black)"
                    {...register(`specifications.${index}.value`)}
                    error={errors.specifications?.[index]?.value?.message}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive shrink-0"
                  onClick={() => removeSpec(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                Add
              </Button>
            </div>
            {(watchedTags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(watchedTags ?? []).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status & Visibility</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-input"
                {...register("isActive")}
              />
              <span className="text-sm font-medium">Active (visible in store)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-input"
                {...register("isFeatured")}
              />
              <span className="text-sm font-medium">Featured product</span>
            </label>
          </CardContent>
        </Card>

        {/* SEO */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">SEO (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            <FormField
              label="Meta Title"
              error={errors.metaTitle?.message}
              htmlFor="metaTitle"
              hint="Max 60 characters"
            >
              <Input
                id="metaTitle"
                maxLength={60}
                {...register("metaTitle")}
                error={errors.metaTitle?.message}
              />
            </FormField>

            <FormField
              label="Meta Description"
              error={errors.metaDescription?.message}
              htmlFor="metaDescription"
              hint="Max 160 characters"
            >
              <textarea
                id="metaDescription"
                rows={3}
                maxLength={160}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                {...register("metaDescription")}
              />
            </FormField>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Button >
            <Link href={productsPath}>Cancel</Link>
          </Button>
          <Button type="submit" loading={isLoading} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
