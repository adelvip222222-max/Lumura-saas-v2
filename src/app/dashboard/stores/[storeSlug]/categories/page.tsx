import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getStoreCategoriesAction } from "@/actions/categories";
import type { ICategory } from "@/models/Category";

export const metadata: Metadata = { title: "Categories" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ storeSlug: string }>;
}

export default async function AdminCategoriesPage({ params }: Props) {
  const { storeSlug } = await params;
  const result = await getStoreCategoriesAction(storeSlug, false);
  const categories = (result.data ?? []) as ICategory[];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">الفئات</h1>
          <p className="text-muted-foreground">{categories.length} فئة لهذا المتجر فقط</p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/stores/${storeSlug}/categories/new`}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة فئة
          </Link>
        </Button>
      </div>

      {result.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {result.error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-right font-medium">الاسم</th>
              <th className="px-4 py-3 text-right font-medium">الرابط</th>
              <th className="px-4 py-3 text-right font-medium">الفئات الفرعية</th>
              <th className="px-4 py-3 text-right font-medium">الحالة</th>
              <th className="px-4 py-3 text-right font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  لا توجد فئات بعد. سيتم إنشاء 15 فئة تلقائيًا عند إنشاء المتجر حسب النشاط، ويمكنك إضافة فئات أخرى يدويًا.
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat._id.toString()} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {cat.icon && <span className="text-lg">{cat.icon}</span>}
                      <span className="font-medium">{cat.nameAr || cat.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground" dir="ltr">
                    {cat.slug}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-muted-foreground">
                      {cat.subcategories?.length ?? 0} فئة فرعية
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {cat.isActive ? <Badge variant="success">نشط</Badge> : <Badge variant="secondary">غير نشط</Badge>}
                      {cat.isFeatured && <Badge>مميز</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/stores/${storeSlug}/categories/${cat.slug}/edit`}>تعديل</Link>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
