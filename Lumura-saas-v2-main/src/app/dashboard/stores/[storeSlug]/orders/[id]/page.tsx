import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/mongodb";
import Order  from "@/models/Order";
import { serialize } from "@/lib/serialize";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import type { OrderStatus } from "@/types";

interface Props {
  params: Promise<{ storeSlug: string; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  await connectToDatabase();
  const order = await Order.findById(id).select("orderNumber").lean();
  return { title: order ? `Order ${order.orderNumber}` : "Order Details" };
}

const statusColors: Record<OrderStatus, "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"> = {
  pending:    "warning",
  confirmed:  "info",
  processing: "info",
  shipped:    "default",
  delivered:  "success",
  cancelled:  "destructive",
  refunded:   "secondary",
};

export default async function OrderDetailPage({ params }: Props) {
  const session = await auth();

  if (!["tenant_admin", "store_admin", "super_admin"].includes(session.user.role)) {
    return { success: false, error: "Insufficient permissions" };
  }


  const { storeSlug, id } = await params;
  await connectToDatabase();

  const raw = await Order.findById(id)
    .populate("userId", "name email")
    .lean();

  if (!raw) notFound();

  const order = serialize(raw) as typeof raw & {
    userId: { name: string; email: string } | null;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Order ${order.orderNumber}`}
        description={`Placed on ${formatDate(order.createdAt)}`}
      >
        <Button >
          <Link href={`/dashboard/stores/${storeSlug}/orders`}><ArrowLeft className="h-4 w-4" /> Back</Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Items + Totals */}
        <div className="space-y-6 lg:col-span-2">

          {/* Items */}
          <Card>
            <CardHeader><CardTitle className="text-base">Order Items ({order.items.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {item.image && (
                        <Image src={item.image} alt={item.name} fill className="object-cover" sizes="56px" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium">{formatCurrency(item.subtotal)}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} × {formatCurrency(item.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardHeader><CardTitle className="text-base">Order Summary</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                { label: "Subtotal",  value: formatCurrency(order.subtotal) },
                { label: "Tax",       value: formatCurrency(order.tax) },
                { label: "Shipping",  value: order.shipping === 0 ? "Free" : formatCurrency(order.shipping) },
                ...(order.discount > 0 ? [{ label: "Discount", value: `-${formatCurrency(order.discount)}` }] : []),
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span>{value}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Info + Status */}
        <div className="space-y-6">

          {/* Status */}
          <Card>
            <CardHeader><CardTitle className="text-base">Status</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Order Status</span>
                <Badge variant={statusColors[order.status as OrderStatus]}>{order.status}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Payment</span>
                <Badge variant={order.paymentStatus === "paid" ? "success" : "warning"}>
                  {order.paymentStatus}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Method</span>
                <span className="text-sm capitalize">{order.paymentMethod.replace(/_/g, " ")}</span>
              </div>
              {order.trackingNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tracking</span>
                  <span className="text-sm font-mono">{order.trackingNumber}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer */}
          <Card>
            <CardHeader><CardTitle className="text-base">Customer</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {order.userId && typeof order.userId === "object" && (
                <>
                  <p className="font-medium">{(order.userId as { name: string }).name}</p>
                  <p className="text-muted-foreground">{(order.userId as { email: string }).email}</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader><CardTitle className="text-base">Shipping Address</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1">
              <p className="font-medium">{order.shippingAddress.fullName}</p>
              <p className="text-muted-foreground">{order.shippingAddress.phone}</p>
              <p className="text-muted-foreground">{order.shippingAddress.street}</p>
              <p className="text-muted-foreground">
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
              </p>
              <p className="text-muted-foreground">{order.shippingAddress.country}</p>
            </CardContent>
          </Card>

          {/* Update Status */}
          <OrderStatusForm orderId={id} currentStatus={order.status as OrderStatus} />
        </div>
      </div>
    </div>
  );
}
