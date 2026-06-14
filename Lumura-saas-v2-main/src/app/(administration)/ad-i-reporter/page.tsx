import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { getAdministrationReport } from "./action";

export default async function AdministrationReporterPage() {
  const { stats, store } = await getAdministrationReport();
  const cards = [
    { label: "إجمالي الطلبات", value: stats.ordersCount.toLocaleString("ar-EG") },
    { label: "إجمالي المنتجات", value: stats.productsCount.toLocaleString("ar-EG") },
    { label: "الإيرادات", value: formatCurrency(stats.revenue) },
    { label: "المدفوع", value: formatCurrency(stats.paidRevenue) },
    { label: "قيد التحصيل", value: formatCurrency(stats.pendingRevenue) },
    { label: "مخزون منخفض", value: stats.lowStockCount.toLocaleString("ar-EG") },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">التقارير المالية</h2>
          <p className="mt-1 text-sm text-gray-500">{store.name}</p>
        </div>
        <a
          href="/ad-i-reporter/download"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-4 text-sm font-medium text-white shadow-sm transition hover:from-orange-600 hover:to-orange-700"
        >
          تحميل التقرير CSV
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader>
              <CardTitle className="text-sm text-gray-500">{card.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
