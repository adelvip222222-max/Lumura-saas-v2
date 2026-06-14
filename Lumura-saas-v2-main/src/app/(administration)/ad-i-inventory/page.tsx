import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdministrationInventory } from "./action";

export default async function AdministrationInventoryPage() {
  const { products, store } = await getAdministrationInventory();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">إدارة المخازن</h2>
        <p className="mt-1 text-sm text-gray-500">{store.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">حالة المخزون</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">
              لا توجد منتجات لمتابعة المخزون.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b text-right text-xs text-gray-500">
                    <th className="py-3 font-medium">المنتج</th>
                    <th className="py-3 font-medium">SKU</th>
                    <th className="py-3 font-medium">المتاح</th>
                    <th className="py-3 font-medium">المباع</th>
                    <th className="py-3 font-medium">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const low = product.stockQuantity <= product.lowStockThreshold;
                    const empty = product.stockQuantity <= 0;

                    return (
                      <tr key={product.id} className="border-b last:border-0">
                        <td className="py-3 font-semibold">{product.name}</td>
                        <td className="py-3 text-gray-500">{product.sku}</td>
                        <td className="py-3">{product.stockQuantity}</td>
                        <td className="py-3">{product.soldQuantity}</td>
                        <td className="py-3">
                          <Badge
                            variant={empty ? "destructive" : low ? "warning" : "success"}
                          >
                            {empty ? "نفد" : low ? "منخفض" : "جيد"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
