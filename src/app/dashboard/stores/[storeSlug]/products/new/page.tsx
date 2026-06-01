// src/app/dashboard/stores/[storeSlug]/products/new/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2, RefreshCw, ArrowLeft, Star, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/admin/form-field";
import { PageHeader } from "@/components/admin/page-header";
import { createProductSchema, type CreateProductInput } from "@/schemas/product";
import { createProductAction } from "@/actions/products";
import { getCategoriesAction } from "@/actions/categories";
import { getBrandsAction } from "@/actions/brands";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";
import type { ICategory } from "@/lib/db/models/Category";
import type { IBrand } from "@/lib/db/models/Brand";
import Link from "next/link";

const UNIT_TYPES = ["piece","kg","gram","liter","meter","box","pack","set","pair"] as const;

const UNIT_LABELS: Record<string, { en: string; ar: string }> = {
  piece:  { en: "Piece",  ar: "قطعة"  },
  kg:     { en: "KG",     ar: "كيلو"  },
  gram:   { en: "Gram",   ar: "جرام"  },
  liter:  { en: "Liter",  ar: "لتر"   },
  meter:  { en: "Meter",  ar: "متر"   },
  box:    { en: "Box",    ar: "صندوق" },
  pack:   { en: "Pack",   ar: "حزمة"  },
  set:    { en: "Set",    ar: "طقم"   },
  pair:   { en: "Pair",   ar: "زوج"   },
};

function genSKU(name: string, category: string): string {
  const n = name.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, "X");
  const c = category.slice(0, 2).toUpperCase().replace(/[^A-Z]/g, "X");
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${c}-${n}-${r}`;
}

export default function NewProductPage() {
  const router = useRouter();
  const params = useParams<{ storeSlug: string }>();
  const storeSlug = params.storeSlug || "";
  const { t, locale } = useTranslation();
  const isAr = locale === "ar";

  const [categories, setCategories] = useState<ICategory[]>([]);
  const [brands, setBrands] = useState<IBrand[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [processingImage, setProcessingImage] = useState<number | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      isActive: true,
      isFeatured: false,
      unitType: "piece",
      stockQuantity: 0,
      lowStockThreshold: 10,
      purchasePrice: 0,
      wholesalePrice: 0,
      sellingPrice: 0,
      tags: [],
      specifications: [],
      variants: [],
      images: [],
      metaKeywords: [],
    },
  });

  const { fields: specFields, append: appendSpec, remove: removeSpec } =
    useFieldArray({ control, name: "specifications" });
  const { fields: imageFields, append: appendImage, remove: removeImage } =
    useFieldArray({ control, name: "images" });

  const watchedName     = watch("name");
  const watchedCategory = watch("category");
  const watchedPurchase = watch("purchasePrice") ?? 0;
  const watchedSelling  = watch("sellingPrice") ?? 0;
  const watchedTags     = watch("tags") ?? [];

  const profitMargin =
    watchedSelling > 0
      ? (((watchedSelling - watchedPurchase) / watchedSelling) * 100).toFixed(1)
      : "0.0";

  const selectedCategory = categories.find(
    (c) => c._id.toString() === watchedCategory
  );

  useEffect(() => {
    getCategoriesAction(false).then((r) => {
      if (r.success && r.data) setCategories(r.data as ICategory[]);
    });
    getBrandsAction(false).then((r) => {
      if (r.success && r.data) setBrands(r.data as IBrand[]);
    });
  }, []);

  function handleAddTag() {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !watchedTags.includes(tag)) {
      setValue("tags", [...watchedTags, tag]);
    }
    setTagInput("");
  }

  // دالة رفع الصورة إلى Cloudinary
  const uploadImageToCloudinary = async (file: File): Promise<{ url: string; publicId: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "product");
    formData.append("storeSlug", storeSlug);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "فشل رفع الصورة");
    }

    return await response.json();
  };

  // دالة إزالة الخلفية من الصورة
  const removeBackground = async (publicId: string, index: number) => {
    setProcessingImage(index);
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const bgRemovedUrl = `https://res.cloudinary.com/${cloudName}/image/upload/e_bgremoval/${publicId}`;
      
      const response = await fetch(bgRemovedUrl);
      const blob = await response.blob();
      const file = new File([blob], `bg-removed-${Date.now()}.png`, { type: "image/png" });
      
      const result = await uploadImageToCloudinary(file);
      
      setValue(`images.${index}.url`, result.url);
      setValue(`images.${index}.publicId`, result.publicId);
      
      toast.success("تم إزالة الخلفية بنجاح");
    } catch (error) {
      toast.error("فشل إزالة الخلفية");
    } finally {
      setProcessingImage(null);
    }
  };

  // دالة إضافة خلفية بيضاء
  const addWhiteBackground = async (publicId: string, index: number) => {
    setProcessingImage(index);
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const whiteBgUrl = `https://res.cloudinary.com/${cloudName}/image/upload/b_white/${publicId}`;
      
      const response = await fetch(whiteBgUrl);
      const blob = await response.blob();
      const file = new File([blob], `white-bg-${Date.now()}.png`, { type: "image/png" });
      
      const result = await uploadImageToCloudinary(file);
      
      setValue(`images.${index}.url`, result.url);
      setValue(`images.${index}.publicId`, result.publicId);
      
      toast.success("تم إضافة خلفية بيضاء");
    } catch (error) {
      toast.error("فشل إضافة الخلفية البيضاء");
    } finally {
      setProcessingImage(null);
    }
  };

  // معالجة اختيار الصور من الجهاز
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const oversizedFiles = files.filter(f => f.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error(`بعض الصور حجمها أكبر من 5MB`);
      return;
    }

    const invalidFiles = files.filter(f => !f.type.startsWith("image/"));
    if (invalidFiles.length > 0) {
      toast.error(`يرجى اختيار صور فقط`);
      return;
    }

    setUploadingImage(true);
    let uploadedCount = 0;
    const errors: string[] = [];

    for (const file of files) {
      try {
        const result = await uploadImageToCloudinary(file);
        const isPrimary = imageFields.length === 0 && uploadedCount === 0;
        appendImage({
          url: result.url,
          publicId: result.publicId,
          alt: "",
          isPrimary: isPrimary,
        });
        uploadedCount++;
      } catch (error) {
        errors.push(file.name);
      }
    }

    setUploadingImage(false);
    
    if (uploadedCount > 0) {
      toast.success(`تم رفع ${uploadedCount} صورة بنجاح`);
    }
    if (errors.length > 0) {
      toast.error(`فشل رفع ${errors.length} صور`);
    }
    
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: CreateProductInput) => {
    if (data.images.length === 0) {
      toast.error(t("atLeastOneImage"));
      return;
    }
    if (!data.images.some((img) => img.isPrimary)) {
      data.images[0].isPrimary = true;
    }

    setIsSubmitting(true);
    try {
      const result = await createProductAction(data, storeSlug);
      
      if (!result?.success) {
        toast.error(result.error ?? t("loading"));
        return;
      }
      toast.success(t("productCreated"));
      router.push(`/dashboard/stores/${storeSlug}/products`);
    } catch {
      toast.error(isAr ? "حدث خطأ ما" : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const textareaClass =
    "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  const selectClass =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      <PageHeader
        title={t("addProduct")}
        description={isAr ? "أدخل تفاصيل المنتج الجديد" : "Fill in the details to create a new product"}
      >
        <Button variant="outline">
          <Link href={`/dashboard/stores/${storeSlug}/products`}>
            <ArrowLeft className={cn("h-4 w-4", isAr && "rotate-180")} />
            {t("back")}
          </Link>
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* ── Left / Main column ─────────────────────────────────────────── */}
          <div className="space-y-6 lg:col-span-2">

            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("basicInfo")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label={t("productName")} required error={errors.name?.message}>
                    <Input {...register("name")} placeholder={isAr ? "مثال: آيفون 15 برو" : "e.g. iPhone 15 Pro"} />
                  </FormField>
                  <FormField label={t("productNameAr")} error={errors.nameAr?.message}>
                    <Input {...register("nameAr")} placeholder="مثال: آيفون 15 برو" dir="rtl" />
                  </FormField>
                </div>

                <FormField label={t("productDescription")} required error={errors.description?.message}>
                  <textarea
                    {...register("description")}
                    rows={4}
                    placeholder={isAr ? "وصف كامل للمنتج..." : "Full product description..."}
                    className={textareaClass}
                  />
                  {errors.description && (
                    <p className="text-xs text-destructive">{errors.description.message}</p>
                  )}
                </FormField>

                <FormField label={t("productDescriptionAr")} error={errors.descriptionAr?.message}>
                  <textarea
                    {...register("descriptionAr")}
                    rows={3}
                    dir="rtl"
                    placeholder="وصف كامل للمنتج بالعربية..."
                    className={textareaClass}
                  />
                </FormField>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label={t("shortDescription")} error={errors.shortDescription?.message}>
                    <textarea
                      {...register("shortDescription")}
                      rows={2}
                      placeholder={isAr ? "ملخص قصير..." : "Brief summary..."}
                      className={textareaClass}
                    />
                  </FormField>
                  <FormField label={t("shortDescriptionAr")} error={errors.shortDescriptionAr?.message}>
                    <textarea
                      {...register("shortDescriptionAr" as keyof CreateProductInput)}
                      rows={2}
                      dir="rtl"
                      placeholder="ملخص قصير بالعربية..."
                      className={textareaClass}
                    />
                  </FormField>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{t("pricing")}</CardTitle>
                  <div className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    Number(profitMargin) >= 20
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  )}>
                    {t("profitMargin")}: {profitMargin}%
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <FormField label={t("purchasePrice")} required error={errors.purchasePrice?.message}>
                    <Input {...register("purchasePrice", { valueAsNumber: true })} type="number" step="0.01" min="0" placeholder="0.00" />
                  </FormField>
                  <FormField label={t("wholesalePrice")} required error={errors.wholesalePrice?.message}>
                    <Input {...register("wholesalePrice", { valueAsNumber: true })} type="number" step="0.01" min="0" placeholder="0.00" />
                  </FormField>
                  <FormField label={t("sellingPrice")} required error={errors.sellingPrice?.message}>
                    <Input {...register("sellingPrice", { valueAsNumber: true })} type="number" step="0.01" min="0" placeholder="0.00" />
                  </FormField>
                  <FormField label={t("discountPrice")} error={errors.discountPrice?.message} hint={t("optional")}>
                    <Input {...register("discountPrice", { valueAsNumber: true })} type="number" step="0.01" min="0" placeholder="0.00" />
                  </FormField>
                </div>
              </CardContent>
            </Card>

            {/* Inventory */}
            <Card>
              <CardHeader><CardTitle className="text-base">{t("inventory")}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <FormField label={t("sku")} required error={errors.sku?.message}>
                    <div className="flex gap-1">
                      <Input {...register("sku")} placeholder="AUTO-SKU" className="uppercase" />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        title={t("autoGenerate")}
                        onClick={() => {
                          const catName = selectedCategory?.name ?? "GEN";
                          setValue("sku", genSKU(watchedName ?? "PRD", catName));
                        }}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </FormField>
                  <FormField label={t("barcode")} error={errors.barcode?.message}>
                    <Input {...register("barcode")} placeholder="EAN / UPC" />
                  </FormField>
                  <FormField label={t("stockQuantity")} required error={errors.stockQuantity?.message}>
                    <Input {...register("stockQuantity", { valueAsNumber: true })} type="number" min="0" placeholder="0" />
                  </FormField>
                  <FormField label={t("lowStockThreshold")} error={errors.lowStockThreshold?.message}>
                    <Input {...register("lowStockThreshold", { valueAsNumber: true })} type="number" min="0" placeholder="10" />
                  </FormField>
                </div>
                <FormField label={t("unitType")} required error={errors.unitType?.message}>
                  <select {...register("unitType")} className={cn(selectClass, "max-w-xs")}>
                    {UNIT_TYPES.map((u) => (
                      <option key={u} value={u}>
                        {isAr ? UNIT_LABELS[u].ar : UNIT_LABELS[u].en}
                      </option>
                    ))}
                  </select>
                </FormField>
              </CardContent>
            </Card>

            {/* Images Section with Upload from Device */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="text-base">{t("images")}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? (
                        <Loader2 className="h-4 w-4 animate-spin ml-2" />
                      ) : (
                        <Upload className="h-4 w-4 ml-2" />
                      )}
                      رفع من الجهاز
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendImage({ url: "", publicId: "", alt: "", isPrimary: imageFields.length === 0 })}
                    >
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة رابط
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
                
                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium mb-1">📸 تعليمات الصور:</p>
                  <ul className="space-y-1 mr-4">
                    <li>• الصيغ المدعومة: JPG, PNG, WEBP, GIF</li>
                    <li>• الحد الأقصى للحجم: 5MB لكل صورة</li>
                    <li>• يمكنك رفع عدة صور مرة واحدة</li>
                    <li>• اضغط على زر النجمة ⭐ لتحديد الصورة الرئيسية</li>
                    <li>• استخدم أزرار ✨ لإزالة الخلفية أو إضافة خلفية بيضاء</li>
                  </ul>
                </div>
                
                {imageFields.length === 0 && (
                  <div 
                    onClick={() => imageInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-orange-500 transition group"
                  >
                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3 group-hover:text-orange-500" />
                    <p className="text-gray-500">اسحب الصور إلى هنا أو اضغط للاختيار</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP (حد أقصى 5MB)</p>
                  </div>
                )}
                
                {imageFields.map((field, idx) => (
                  <div key={field.id} className="flex items-start gap-3 rounded-lg border p-3 hover:shadow-md transition">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {watch(`images.${idx}.url`) ? (
                        <img
                          src={watch(`images.${idx}.url`)}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          📷
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <Input
                        {...register(`images.${idx}.url`)}
                        placeholder="رابط الصورة"
                        className="text-sm"
                      />
                      {errors.images?.[idx]?.url && (
                        <p className="text-xs text-red-500">{errors.images[idx]?.url?.message}</p>
                      )}
                      <div className="flex gap-2">
                        <Input
                          {...register(`images.${idx}.publicId`)}
                          placeholder="Public ID"
                          className="flex-1 text-sm"
                        />
                        <Input
                          {...register(`images.${idx}.alt`)}
                          placeholder="نص بديل"
                          className="flex-1 text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center gap-2">
                      <button
                        type="button"
                        title="تعيين كصورة رئيسية"
                        onClick={() => imageFields.forEach((_, i) => setValue(`images.${i}.isPrimary`, i === idx))}
                        className={cn(
                          "rounded-full p-1.5 transition-colors",
                          watch(`images.${idx}.isPrimary`)
                            ? "bg-yellow-100 text-yellow-600"
                            : "text-gray-400 hover:text-yellow-500"
                        )}
                      >
                        <Star className="h-4 w-4" />
                      </button>
                      
                      {watch(`images.${idx}.publicId`) && (
                        <>
                          <button
                            type="button"
                            title="إزالة الخلفية"
                            onClick={() => removeBackground(watch(`images.${idx}.publicId`), idx)}
                            disabled={processingImage === idx}
                            className="rounded-full p-1.5 text-purple-500 hover:bg-purple-50 transition-colors"
                          >
                            {processingImage === idx ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <span className="text-sm">✨</span>
                            )}
                          </button>
                          
                          <button
                            type="button"
                            title="إضافة خلفية بيضاء"
                            onClick={() => addWhiteBackground(watch(`images.${idx}.publicId`), idx)}
                            disabled={processingImage === idx}
                            className="rounded-full p-1.5 text-blue-500 hover:bg-blue-50 transition-colors"
                          >
                            {processingImage === idx ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <span className="text-sm">🎨</span>
                            )}
                          </button>
                        </>
                      )}
                      
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="rounded-full p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Specifications */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{t("specifications")}</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={() => appendSpec({ key: "", value: "" })}>
                    <Plus className="h-4 w-4" /> {t("addRow")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {specFields.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {isAr ? "لا توجد مواصفات بعد." : "No specifications yet."}
                  </p>
                )}
                {specFields.map((field, idx) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <Input {...register(`specifications.${idx}.key`)} placeholder={t("specKey")} className="flex-1" />
                    <Input {...register(`specifications.${idx}.value`)} placeholder={t("specValue")} className="flex-1" />
                    <button type="button" onClick={() => removeSpec(idx)}
                      className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader><CardTitle className="text-base">{t("tags")}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(); } }}
                    placeholder={isAr ? "اكتب وسماً واضغط Enter" : "Type a tag and press Enter"}
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>{t("add")}</Button>
                </div>
                {watchedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {watchedTags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                        {tag}
                        <button type="button" onClick={() => setValue("tags", watchedTags.filter((t) => t !== tag))}
                          className="ml-1 text-muted-foreground hover:text-destructive">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SEO */}
            <Card>
              <CardHeader><CardTitle className="text-base">{t("seo")} ({t("optional")})</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField label={t("metaTitle")} hint={isAr ? "حد أقصى 60 حرف" : "Max 60 characters"} error={errors.metaTitle?.message}>
                  <Input {...register("metaTitle")} maxLength={60} />
                </FormField>
                <FormField label={t("metaDescription")} hint={isAr ? "حد أقصى 160 حرف" : "Max 160 characters"} error={errors.metaDescription?.message}>
                  <textarea {...register("metaDescription")} rows={2} maxLength={160} className={textareaClass} />
                </FormField>
              </CardContent>
            </Card>
          </div>

          {/* ── Right column ───────────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Status */}
            <Card>
              <CardHeader><CardTitle className="text-base">{t("status")}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <label className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{t("active")}</p>
                    <p className="text-xs text-muted-foreground">{t("visibleInStore")}</p>
                  </div>
                  <input type="checkbox" {...register("isActive")} className="h-4 w-4 accent-orange-500" />
                </label>
                <label className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{t("featured")}</p>
                    <p className="text-xs text-muted-foreground">{t("showOnHomepage")}</p>
                  </div>
                  <input type="checkbox" {...register("isFeatured")} className="h-4 w-4 accent-orange-500" />
                </label>
              </CardContent>
            </Card>

            {/* Classification */}
            <Card>
              <CardHeader><CardTitle className="text-base">{isAr ? "التصنيف" : "Classification"}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField label={t("category")} required error={errors.category?.message}>
                  <select {...register("category")} className={selectClass}>
                    <option value="">{isAr ? "اختر الفئة..." : "Select category..."}</option>
                    {categories.map((c) => (
                      <option key={c._id.toString()} value={c._id.toString()}>
                        {isAr && c.nameAr ? c.nameAr : c.name}
                      </option>
                    ))}
                  </select>
                </FormField>

                {selectedCategory && selectedCategory.subcategories.length > 0 && (
                  <FormField label={t("subcategory")} error={errors.subcategoryId?.message}>
                    <select
                      {...register("subcategoryId")}
                      onChange={(e) => {
                        const sub = selectedCategory.subcategories.find(
                          (s) => s._id.toString() === e.target.value
                        );
                        setValue("subcategoryId", e.target.value);
                        setValue("subcategoryName", sub?.name ?? "");
                      }}
                      className={selectClass}
                    >
                      <option value="">{isAr ? "اختر الفئة الفرعية..." : "Select subcategory..."}</option>
                      {selectedCategory.subcategories.map((s) => (
                        <option key={s._id.toString()} value={s._id.toString()}>
                          {isAr && s.nameAr ? s.nameAr : s.name}
                        </option>
                      ))}
                    </select>
                  </FormField>
                )}

                <FormField label={t("brand")} required error={errors.brand?.message}>
                  <select {...register("brand")} className={selectClass}>
                    <option value="">{isAr ? "اختر الماركة..." : "Select brand..."}</option>
                    {brands.map((b) => (
                      <option key={b._id.toString()} value={b._id.toString()}>
                        {isAr && b.nameAr ? b.nameAr : b.name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label={t("supplierName")} error={errors.supplierName?.message}>
                  <Input {...register("supplierName")} placeholder={isAr ? "اسم المورد / البائع" : "Supplier / vendor name"} />
                </FormField>
              </CardContent>
            </Card>

            {/* Profit Summary */}
            <Card>
              <CardHeader><CardTitle className="text-base">{t("profitSummary")}</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {[
                  { label: t("purchasePrice"), value: `${(watchedPurchase || 0).toFixed(2)} ج.م` },
                  { label: t("sellingPrice"),  value: `${(watchedSelling || 0).toFixed(2)} ج.م` },
                  { label: t("grossProfit"),   value: `${((watchedSelling || 0) - (watchedPurchase || 0)).toFixed(2)} ج.م` },
                  { label: t("profitMargin"),  value: `${profitMargin}%` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" size="lg" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("createProduct")}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}