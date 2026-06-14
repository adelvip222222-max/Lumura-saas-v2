"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/admin/form-field";
import { PageHeader } from "@/components/admin/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { updateCategorySchema, type UpdateCategoryInput } from "@/schemas/category";
import { getCategoryBySlugAction, updateCategoryAction } from "@/actions/categories";
import Link from "next/link";

function toSlug(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams<{ storeSlug: string; categorySlug: string }>();
  const storeSlug = params.storeSlug || "";
  const categorySlug = params.categorySlug || "";
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryName, setCategoryName] = useState("Category");

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<UpdateCategoryInput>({
    resolver: zodResolver(updateCategorySchema),
    defaultValues: { id: "", subcategories: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "subcategories" });

  useEffect(() => {
    getCategoryBySlugAction(categorySlug, false)
      .then((result) => {
        if (result.success && result.data) {
          const cat = result.data;
          setCategoryName(cat.name);
          reset({
            id: cat._id.toString(),
            name: cat.name,
            nameAr: cat.nameAr ?? "",
            slug: cat.slug,
            description: cat.description ?? "",
            descriptionAr: cat.descriptionAr ?? "",
            icon: cat.icon ?? "",
            isActive: cat.isActive,
            isFeatured: cat.isFeatured,
            sortOrder: cat.sortOrder ?? 0,
            metaTitle: cat.metaTitle ?? "",
            metaDescription: cat.metaDescription ?? "",
            subcategories: cat.subcategories ?? [],
          });
        } else {
          toast.error(result.error ?? "Category not found");
        }
      })
      .catch(() => toast.error("Failed to load category"))
      .finally(() => setIsLoading(false));
  }, [categorySlug, reset]);

  const onSubmit = async (data: UpdateCategoryInput) => {
    setIsSubmitting(true);
    try {
      const result = await updateCategoryAction(data);
      if (!result.success) {
        toast.error(result.error ?? "Failed to update category");
        return;
      }
      toast.success("Category updated successfully");
      router.push(`/dashboard/stores/${storeSlug}/categories`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`Edit: ${categoryName}`} description="Update category details">
        <Button>
          <Link href={`/dashboard/stores/${storeSlug}/categories`}><ArrowLeft className="h-4 w-4" /> Back</Link>
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <input type="hidden" {...register("id")} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Basic Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label="Name" required error={errors.name?.message}>
                    <Input {...register("name")} onChange={(e) => {
                      setValue("name", e.target.value);
                      setValue("slug", toSlug(e.target.value));
                    }} />
                  </FormField>
                  <FormField label="Arabic Name">
                    <Input {...register("nameAr")} dir="rtl" />
                  </FormField>
                </div>
                <FormField label="Slug" required error={errors.slug?.message}>
                  <Input {...register("slug")} className="font-mono text-sm" />
                </FormField>
                <FormField label="Icon">
                  <Input {...register("icon")} className="w-24 text-xl" />
                </FormField>
                <FormField label="Description">
                  <textarea {...register("description")} rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </FormField>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Subcategories</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ name: "", slug: "", isActive: true, sortOrder: fields.length })}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {fields.map((field, idx) => (
                  <div key={field.id} className="flex gap-2">
                    <Input {...register(`subcategories.${idx}.name`)} placeholder="Name" />
                    <Input {...register(`subcategories.${idx}.slug`)} placeholder="Slug" className="font-mono text-sm" />
                    <Button type="button" variant="ghost" size="sm" onClick={() => remove(idx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Status</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" {...register("isActive")} />
                  <span>Active</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" {...register("isFeatured")} />
                  <span>Featured</span>
                </label>
              </CardContent>
            </Card>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Category"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
