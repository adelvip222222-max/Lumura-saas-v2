// src/app/dashboard/stores/[storeSlug]/brands/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getBrandsAction } from "@/actions/brands";
import type { IBrand } from "@/lib/db/models/Brand";
import { getStoreBySlug } from "@/lib/store/store-actions";

export const metadata: Metadata = { title: "Brands" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ storeSlug: string }>;
}

export default async function StoreBrandsPage({ params }: Props) {
  const { storeSlug } = await params;
  
  // جلب بيانات المتجر
  const store = await getStoreBySlug(storeSlug);
  if (!store) {
    return <div className="p-8 text-center">المتجر غير موجود</div>;
  }
  
  const result = await getBrandsAction(false);
  const brands = (result.data ?? []) as IBrand[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">العلامات التجارية</h1>
          <p className="text-gray-500">{brands.length} علامة تجارية</p>
        </div>
        <Button>
          <Link href={`/dashboard/stores/${storeSlug}/brands/new`}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة علامة تجارية
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brands.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            لا توجد علامات تجارية
          </div>
        ) : (
          brands.map((brand) => (
            <div
              key={brand._id.toString()}
              className="rounded-lg border bg-white p-4 flex items-center justify-between shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center gap-3">
                {brand.logo ? (
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="h-10 w-10 rounded-lg object-contain"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center text-sm font-bold text-orange-600">
                    {brand.name[0]}
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{brand.name}</p>
                  <p className="text-xs text-gray-500 font-mono">{brand.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {brand.isActive ? (
                  <Badge variant="success" className="bg-green-100 text-green-700">نشط</Badge>
                ) : (
                  <Badge variant="secondary">غير نشط</Badge>
                )}
                {/* ✅ الرابط المعدل - يذهب إلى صفحة التعديل في المتجر */}
                <Button variant="outline" size="sm">
                  <Link href={`/dashboard/stores/${storeSlug}/brands/${brand._id}/edit`}>
                    تعديل
                  </Link>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}