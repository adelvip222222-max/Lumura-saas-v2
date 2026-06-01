import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, Heart, ShoppingCart, User, Store } from "lucide-react";
import { getCustomerAccountData } from "@/actions/customer-account";
import { getStoreOwnerDashboardUrl } from "@/lib/customer/store-owner";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  params: Promise<{ storeSlug: string }>;
}

export default async function CustomerAccountPage({ params }: Props) {
  const { storeSlug } = await params;
  const base = `/${storeSlug}`;

  const result = await getCustomerAccountData(storeSlug);
  if (!result.success) {
    redirect(`${base}/login`);
  }

  const { customer, user, orders, wishlist } = result.data;
  const dashboardUrl = await getStoreOwnerDashboardUrl(storeSlug);

  const ordersList = (orders as Array<{
    _id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
  }>) ?? [];

  const wishlistList = (wishlist as Array<{ _id: string; name: string; slug: string }>) ?? [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif">حسابي</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {customer.storeName} · {customer.email}
          </p>
        </div>
        {dashboardUrl && (
          <Button asChild className="store-btn-primary">
            <Link href={dashboardUrl}>
              <Store className="h-4 w-4 ml-2" />
              عودة لإدارة المتجر
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href={`${base}/orders`}>
          <Card className="store-card hover:shadow-md transition-shadow h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center gap-2">
              <Package className="h-8 w-8 store-text-primary" />
              <p className="font-semibold">طلباتي</p>
              <p className="text-2xl font-bold">{ordersList.length}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href={`${base}/wishlist`}>
          <Card className="store-card hover:shadow-md transition-shadow h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center gap-2">
              <Heart className="h-8 w-8 store-text-primary" />
              <p className="font-semibold">المفضلة</p>
              <p className="text-2xl font-bold">{wishlistList.length}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href={`${base}/cart`}>
          <Card className="store-card hover:shadow-md transition-shadow h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center gap-2">
              <ShoppingCart className="h-8 w-8 store-text-primary" />
              <p className="font-semibold">سلة التسوق</p>
              <p className="text-sm text-muted-foreground">عرض السلة</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            بيانات الحساب
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <p>
            <span className="text-muted-foreground">الاسم: </span>
            {(user as { name?: string })?.name || customer.name}
          </p>
          <p>
            <span className="text-muted-foreground">البريد: </span>
            {customer.email}
          </p>
          <p>
            <span className="text-muted-foreground">المتجر: </span>
            {customer.storeName}
          </p>
          <p>
            <span className="text-muted-foreground">المستأجر: </span>
            {customer.tenantSlug || "—"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">آخر الطلبات</CardTitle>
          <Link href={`${base}/orders`} className="text-sm store-text-primary hover:underline">
            عرض الكل
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {ordersList.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">لا توجد طلبات بعد</p>
          ) : (
            ordersList.slice(0, 5).map((order) => (
              <div
                key={order._id}
                className="flex items-center justify-between rounded-lg border p-3 gap-3"
              >
                <div>
                  <p className="font-mono font-semibold text-sm">{order.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(new Date(order.createdAt))}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{order.status}</Badge>
                  <span className="font-bold">{formatCurrency(order.total)}</span>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`${base}/orders/${order._id}`}>تفاصيل</Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

    </div>
  );
}
