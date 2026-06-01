import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getAdministrationOrders, updateAdministrationOrderAction } from "./action";

const statusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  processing: "قيد التجهيز",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
  refunded: "مسترد",
};

const paymentLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  paid: "مدفوع",
  failed: "فشل الدفع",
  refunded: "مسترد",
};

const statuses = Object.keys(statusLabels);
const paymentStatuses = Object.keys(paymentLabels);

export default async function AdministrationOrdersPage() {
  const { orders, store } = await getAdministrationOrders();

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">إدارة الطلبات</h2>
          <p className="mt-1 text-sm text-gray-500">
            متابعة الطلبات وتحديث حالتها لمتجر {store.name}
          </p>
        </div>
        <div className="rounded-lg border bg-white px-4 py-3 text-sm text-gray-600">
          إجمالي الطلبات المعروضة: <span className="font-bold text-gray-900">{orders.length}</span>
        </div>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent>
            <p className="py-10 text-center text-sm text-gray-500">
              لا توجد طلبات حتى الآن.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="border-b bg-white">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <CardTitle className="text-base">
                      طلب #{order.orderNumber}
                    </CardTitle>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                      <span>{order.createdAt ? formatDate(order.createdAt) : "-"}</span>
                      <span>•</span>
                      <span>{order.customerName}</span>
                      {order.customerPhone && (
                        <>
                          <span>•</span>
                          <span>{order.customerPhone}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{statusLabels[order.status] ?? order.status}</Badge>
                    <Badge variant={order.paymentStatus === "paid" ? "success" : "secondary"}>
                      {paymentLabels[order.paymentStatus] ?? order.paymentStatus}
                    </Badge>
                    <Badge variant="outline">{formatCurrency(order.total)}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-5 p-5 xl:grid-cols-[1fr_360px]">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold uppercase text-gray-400">عنوان العميل</p>
                    <p className="mt-1 text-sm text-gray-700">{order.address || "غير محدد"}</p>
                  </div>
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full min-w-[560px] text-sm">
                      <thead className="bg-gray-50 text-xs text-gray-500">
                        <tr>
                          <th className="px-3 py-2 text-right font-medium">المنتج</th>
                          <th className="px-3 py-2 text-right font-medium">SKU</th>
                          <th className="px-3 py-2 text-right font-medium">الكمية</th>
                          <th className="px-3 py-2 text-right font-medium">الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item, index) => (
                          <tr key={`${order.id}-${index}`} className="border-t">
                            <td className="px-3 py-2 font-medium">{item.name}</td>
                            <td className="px-3 py-2 text-gray-500">{item.sku}</td>
                            <td className="px-3 py-2">{item.quantity}</td>
                            <td className="px-3 py-2 font-semibold">{formatCurrency(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <form action={updateAdministrationOrderAction} className="space-y-3 rounded-lg border bg-gray-50 p-4">
                  <input type="hidden" name="orderId" value={order.id} />
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <label className="space-y-1 text-sm">
                      <span className="font-medium text-gray-700">حالة الطلب</span>
                      <select
                        name="status"
                        defaultValue={order.status}
                        className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm"
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {statusLabels[status]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="font-medium text-gray-700">حالة الدفع</span>
                      <select
                        name="paymentStatus"
                        defaultValue={order.paymentStatus}
                        className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm"
                      >
                        {paymentStatuses.map((status) => (
                          <option key={status} value={status}>
                            {paymentLabels[status]}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-gray-700">رقم التتبع</span>
                    <Input name="trackingNumber" defaultValue={order.trackingNumber} placeholder="مثال: TRK-10045" />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-gray-700">ملاحظات داخلية</span>
                    <Textarea name="notes" defaultValue={order.notes} rows={3} placeholder="ملاحظات التجهيز أو التواصل..." />
                  </label>
                  <Button type="submit" className="w-full">
                    حفظ تحديث الطلب
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
