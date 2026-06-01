// src/app/dashboard/stores/[storeSlug]/brands/[id]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/admin/form-field";
import { PageHeader } from "@/components/admin/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { updateBrandSchema, type UpdateBrandInput } from "@/schemas/brand";
import { updateBrandAction } from "@/actions/brands";

export default function EditBrandPage() {
  const router = useRouter();
  const params = useParams<{ storeSlug: string; id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [brandName, setBrandName] = useState("Brand");

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<UpdateBrandInput>({
    resolver: zodResolver(updateBrandSchema),
    defaultValues: { id: params.id },
  });

  useEffect(() => {
    fetch(`/api/Tenant/brands/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.brand) {
          const b = data.brand;
          setBrandName(b.name);
          reset({
            id: b._id,
            name: b.name,
            nameAr: b.nameAr ?? "",
            slug: b.slug,
            description: b.description ?? "",
            logo: b.logo ?? "",
            website: b.website ?? "",
            isActive: b.isActive,
            isFeatured: b.isFeatured,
            sortOrder: b.sortOrder ?? 0,
            metaTitle: b.metaTitle ?? "",
            metaDescription: b.metaDescription ?? "",
          });
        }
      })
      .catch(() => toast.error("Failed to load brand"))
      .finally(() => setIsLoading(false));
  }, [params.id, reset]);

  const onSubmit = async (data: UpdateBrandInput) => {
    setIsSubmitting(true);
    try {
      const result = await updateBrandAction(data);
      if (!result.success) {
        toast.error(result.error ?? "Failed to update brand");
        return;
      }
      toast.success("Brand updated successfully");
      
      // ✅ التوجيه إلى صفحة العلامات التجارية في نفس المتجر
      router.push(`/dashboard/stores/${params.storeSlug}/brands`);
      
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`تعديل: ${brandName}`} description="تحديث بيانات العلامة التجارية">
        <Button variant="outline">
          <Link href={`/dashboard/stores/${params.storeSlug}/brands`}>
            <ArrowLeft className="h-4 w-4 ml-2" />
            رجوع
          </Link>
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <input type="hidden" {...register("id")} />
        
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">معلومات أساسية</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="اسم العلامة" required error={errors.name?.message} htmlFor="name">
              <Input
                id="name"
                {...register("name")}
                error={errors.name?.message}
              />
            </FormField>

            <FormField label="الاسم (عربي)" error={errors.nameAr?.message} htmlFor="nameAr">
              <Input
                id="nameAr"
                dir="rtl"
                {...register("nameAr")}
                error={errors.nameAr?.message}
              />
            </FormField>

            <FormField label="Slug" required error={errors.slug?.message} htmlFor="slug">
              <Input
                id="slug"
                {...register("slug")}
                error={errors.slug?.message}
              />
            </FormField>

            <FormField label="شعار العلامة (URL)" error={errors.logo?.message} htmlFor="logo">
              <Input
                id="logo"
                {...register("logo")}
                placeholder="https://example.com/logo.png"
                error={errors.logo?.message}
              />
            </FormField>

            <FormField label="الموقع الإلكتروني" error={errors.website?.message} htmlFor="website">
              <Input
                id="website"
                {...register("website")}
                placeholder="https://example.com"
                error={errors.website?.message}
              />
            </FormField>

            <FormField label="الوصف" error={errors.description?.message} htmlFor="description">
              <textarea
                id="description"
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...register("description")}
              />
            </FormField>
          </CardContent>
        </Card>

        {/* SEO */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">SEO (اختياري)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            <FormField label="Meta Title" error={errors.metaTitle?.message} htmlFor="metaTitle">
              <Input
                id="metaTitle"
                {...register("metaTitle")}
                error={errors.metaTitle?.message}
              />
            </FormField>

            <FormField label="Meta Description" error={errors.metaDescription?.message} htmlFor="metaDescription">
              <textarea
                id="metaDescription"
                rows={2}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...register("metaDescription")}
              />
            </FormField>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">الحالة</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-input accent-orange-500"
                {...register("isActive")}
              />
              <span className="text-sm font-medium">نشط</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-input accent-orange-500"
                {...register("isFeatured")}
              />
              <span className="text-sm font-medium">مميز</span>
            </label>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline">
            <Link href={`/dashboard/stores/${params.storeSlug}/brands`}>
              إلغاء
            </Link>
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "جاري الحفظ..." : "حفظ التغييرات"}
          </Button>
        </div>
      </form>
    </div>
  );
}