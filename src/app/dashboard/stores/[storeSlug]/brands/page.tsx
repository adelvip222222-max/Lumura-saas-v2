// src/app/dashboard/stores/[storeSlug]/brands/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getStoreBrandsAction } from "@/actions/brands";
import type { IBrand } from "@/models/Brand";

export const metadata: Metadata = { title: "Brands" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ storeSlug: string }>;
}

export default async function StoreBrandsPage({ params }: Props) {
  const { storeSlug } = await params;
  const result = await getStoreBrandsAction(storeSlug, false);
  const brands = (result.data ?? []) as IBrand[];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">العلامات التجارية</h1>
          <p className="text-gray-500">{brands.length} علامة تجارية لهذا المتجر فقط</p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/stores/${storeSlug}/brands/new`}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة علامة تجارية
          </Link>
        </Button>
      </div>

      {result.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {result.error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brands.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed bg-white py-12 text-center text-gray-500">
            لا توجد علامات تجارية بعد. سيتم إنشاء 15 ماركة تلقائيًا عند إنشاء المتجر حسب النشاط، ويمكنك إضافة ماركات أخرى يدويًا.
          </div>
        ) : (
          brands.map((brand) => (
            <div
              key={brand._id.toString()}
              className="rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {brand.logo ? (
                    <img src={brand.logo} alt={brand.name} className="h-11 w-11 rounded-lg object-contain" />
                  ) : (
                    <div className="grid h-11 w-11 place-items-center rounded-lg bg-orange-100 text-sm font-bold text-orange-600">
                      {brand.name[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-gray-900">{brand.nameAr || brand.name}</p>
                    <p className="text-xs text-gray-500 font-mono" dir="ltr">{brand.slug}</p>
                  </div>
                </div>
                {brand.isActive ? (
                  <Badge variant="success" className="bg-green-100 text-green-700">نشط</Badge>
                ) : (
                  <Badge variant="secondary">غير نشط</Badge>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between gap-2">
                {brand.isFeatured ? <Badge>مميز</Badge> : <span />}
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/stores/${storeSlug}/brands/${brand._id}/edit`}>تعديل</Link>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
