import { redirect } from "next/navigation";
import Link from "next/link";
import { getCustomerOrdersAction } from "@/actions/customer-account";
import { getCustomerFromCookie } from "@/lib/jwt/customer-jwt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ShoppingBag } from "lucide-react";

interface Props {
  params: Promise<{ storeSlug: string }>;
  searchParams: Promise<{ status?: string; page?: string }>;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  processing: "قيد التجهيز",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
  refunded: "مسترد",
};

export default async function StoreOrdersPage({ params, searchParams }: Props) {
  const { storeSlug } = await params;
  const sp = await searchParams;
  const base = `/${storeSlug}`;

  const customer = await getCustomerFromCookie(storeSlug);
  if (!customer) redirect(`${base}/login?callbackUrl=${base}/orders`);

  const result = await getCustomerOrdersAction(storeSlug, {
    status: sp.status || undefined,
    page: sp.page ? Number(sp.page) : 1,
    limit: 10,
  });

  if (!result.success) redirect(`${base}/login`);

  const orders = (result.data?.data ?? []) as Array<{
    _id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
    items: Array<unknown>;
  }>;
  const pagination = result.data?.pagination;

  const statusFilters = [
    { label: "الكل", value: "" },
    { label: "قيد الانتظار", value: "pending" },
    { label: "تم التسليم", value: "delivered" },
    { label: "ملغي", value: "cancelled" },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-2 font-serif">طلباتي</h1>
      <p className="text-sm text-muted-foreground mb-8">{customer.storeName}</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {statusFilters.map((f) => (
          <Link key={f.value} href={`${base}/orders${f.value ? `?status=${f.value}` : ""}`}>
            <Badge
              variant={sp.status === f.value || (!sp.status && !f.value) ? "default" : "outline"}
              className="cursor-pointer"
            >
              {f.label}
            </Badge>
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">لا توجد طلبات</h2>
          <Button asChild className="store-btn-primary mt-4">
            <Link href={`${base}/products`}>تسوق الآن</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="rounded-lg border bg-card p-6 store-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-mono font-semibold">{order.orderNumber}</p>
                    <Badge variant="outline">
                      {STATUS_LABELS[order.status] || order.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(new Date(order.createdAt))} · {order.items?.length ?? 0} منتج
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-bold text-lg">{formatCurrency(order.total)}</p>
                  <Button asChild variant="outline">
                    <Link href={`${base}/orders/${order._id}`}>التفاصيل</Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              {pagination.hasPrev && (
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={`${base}/orders?page=${pagination.page - 1}${sp.status ? `&status=${sp.status}` : ""}`}
                  >
                    السابق
                  </Link>
                </Button>
              )}
              <span className="text-sm text-muted-foreground">
                {pagination.page} / {pagination.totalPages}
              </span>
              {pagination.hasNext && (
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={`${base}/orders?page=${pagination.page + 1}${sp.status ? `&status=${sp.status}` : ""}`}
                  >
                    التالي
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
