// src/app/dashboard/stores/[storeSlug]/inventory/page.tsx
import type { Metadata } from "next";
import { getLowStockProductsAction } from "@/actions/analytics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Package } from "lucide-react";
import Link from "next/link";
import { getAdminProductsAction } from "@/actions/products";
import type { IProduct } from "@/lib/db/models/Product";
import { getStoreBySlug } from "@/lib/store/store-actions";

export const metadata: Metadata = { title: "Inventory" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ storeSlug: string }>;
}

export default async function StoreInventoryPage({ params }: Props) {
  const { storeSlug } = await params;
  
  // جلب بيانات المتجر
  const store = await getStoreBySlug(storeSlug);
  if (!store) {
    return <div className="p-8 text-center">المتجر غير موجود</div>;
  }
  
  const [lowStockResult, productsResult] = await Promise.all([
    getLowStockProductsAction(),
    getAdminProductsAction({ page: 1, limit: 50 }, storeSlug),
  ]);

  const lowStockProducts = lowStockResult.data ?? [];
  const products = (productsResult.data?.data ?? []) as IProduct[];

  const outOfStock = products.filter((p) => p.stockQuantity === 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">إدارة المخزون</h1>
        <p className="text-gray-500">مراقبة وإدارة مستويات المخزون</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-3">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">إجمالي المنتجات</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-yellow-100 p-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">مخزون منخفض</p>
                <p className="text-2xl font-bold text-gray-900">{lowStockProducts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-3">
                <Package className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">نفد من المخزون</p>
                <p className="text-2xl font-bold text-gray-900">{outOfStock.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              تنبيهات المخزون المنخفض ({lowStockProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div
                  key={product._id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <Badge
                        variant={product.stockQuantity === 0 ? "destructive" : "warning"}
                      >
                        {product.stockQuantity} قطعة متبقية
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        الحد الأدنى: {product.lowStockThreshold}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Link href={`/dashboard/stores/${storeSlug}/products/${product.slug}/edit`}>
                        تعديل المخزون
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">جميع المنتجات</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">المنتج</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">SKU</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">المخزون</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">تم البيع</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">الحالة</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((product) => (
                  <tr key={product._id.toString()} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{product.sku}</td>
                    <td className="px-4 py-3 text-gray-700">{product.stockQuantity}</td>
                    <td className="px-4 py-3 text-gray-700">{product.soldQuantity}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          product.stockQuantity === 0
                            ? "destructive"
                            : product.stockQuantity <= product.lowStockThreshold
                              ? "warning"
                              : "success"
                        }
                      >
                        {product.stockQuantity === 0
                          ? "نفد من المخزون"
                          : product.stockQuantity <= product.lowStockThreshold
                            ? "مخزون منخفض"
                            : "متوفر"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="outline" size="sm">
                        <Link href={`/dashboard/stores/${storeSlug}/products/${product.slug}/edit`}>
                          تعديل
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}