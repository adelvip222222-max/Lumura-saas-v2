// src/app/dashboard/stores/[storeSlug]/products/page.tsx
import { getAdminProductsAction } from "@/actions/products";
import { getStoreBySlug } from "@/lib/store/store-actions";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Edit, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export default async function StoreProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeSlug: string }>;
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  
  const { storeSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const search = resolvedSearchParams.search?.trim() ?? "";
  const store = await getStoreBySlug(storeSlug);
  
  if (!store) {
    redirect("/dashboard");
  }
  
  const result = await getAdminProductsAction(
    {
      page: resolvedSearchParams.page ? Number(resolvedSearchParams.page) : 1,
      limit: 20,
      search,
    },
    storeSlug  // ✅ تمرير storeSlug للفلترة
  );
  
  const products = result.data?.data ?? [];
  const pagination = result.data?.pagination;
  const productsPath = `/dashboard/stores/${storeSlug}/products`;

  const getProductsHref = (page: number) => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (search) params.set("search", search);
    const query = params.toString();
    return query ? `${productsPath}?${query}` : productsPath;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المنتجات</h1>
          <p className="text-gray-500">{pagination?.total ?? 0} منتج</p>
        </div>
        <Link href={`/dashboard/stores/${storeSlug}/products/new`}>
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus className="h-4 w-4 ml-2" />
            إضافة منتج
          </Button>
        </Link>
      </div>
      
      {/* Search */}
      <form method="GET" className="flex gap-2">
        <input
          name="search"
          defaultValue={search}
          placeholder="بحث عن منتج..."
          className="flex h-10 w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
        />
        <Button type="submit" variant="outline">بحث</Button>
      </form>
      
      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-right font-medium text-gray-600">المنتج</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">SKU</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">السعر</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">المخزون</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">الحالة</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    لا توجد منتجات
                  </td>
                </tr>
              ) : (
                products.map((product: any) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.thumbnail && (
                          <img
                            src={product.thumbnail}
                            alt={product.name}
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">
                            {product.category?.name || "بدون فئة"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{product.sku}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-orange-600">
                        {formatCurrency(product.sellingPrice)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={
                        product.stockQuantity === 0 ? "destructive" :
                        product.stockQuantity <= (product.lowStockThreshold || 10) ? "warning" : "success"
                      }>
                        {product.stockQuantity}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={product.isActive ? "success" : "secondary"}>
                        {product.isActive ? "نشط" : "غير نشط"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link href={`/dashboard/stores/${storeSlug}/products/${product.slug}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3 ml-1" />
                            تعديل
                          </Button>
                        </Link>
<Link 
  href={`/${storeSlug}/products/${product.slug}`} 
  target="_blank"
>
  <Button >
    <Eye className="h-3 w-3 ml-1" />
    عرض
  </Button>
</Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination */}
      {pagination && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">
            صفحة {pagination.page} من {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            {pagination.hasPrev && (
              <Button >
                <Link href={getProductsHref(pagination.page - 1)}>
                  السابق
                </Link>
              </Button>
            )}
            {pagination.hasNext && (
              <Button >
                <Link href={getProductsHref(pagination.page + 1)}>
                  التالي
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
