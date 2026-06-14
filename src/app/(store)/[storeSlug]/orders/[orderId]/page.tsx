import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getCustomerFromCookie } from "@/lib/jwt/customer-jwt";
import { getCustomerOrderByIdAction } from "@/actions/customer-account";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CheckCircle, Package, Truck, MapPin, CreditCard, ArrowLeft } from "lucide-react";
import { CancelOrderButton } from "@/components/store-front/cancel-order-button";
import type { IOrder } from "@/models/Order";
import type { OrderStatus } from "@/types";

interface Props {
  params:      Promise<{ storeSlug: string; orderId: string }>;
  searchParams: Promise<{ success?: string }>;
}

const STATUS_STEPS: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered"];

const STATUS_COLORS: Record<OrderStatus, "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"> = {
  pending:    "warning",
  confirmed:  "info",
  processing: "info",
  shipped:    "default",
  delivered:  "success",
  cancelled:  "destructive",
  refunded:   "secondary",
};

export default async function StoreOrderDetailPage({ params, searchParams }: Props) {
  const { storeSlug, orderId } = await params;
  const sp   = await searchParams;
  const base = `/${storeSlug}`;

  const customer = await getCustomerFromCookie(storeSlug);
  if (!customer) redirect(`${base}/login?callbackUrl=${base}/orders/${orderId}`);

  const result = await getCustomerOrderByIdAction(storeSlug, orderId);
  if (!result.success || !result.data) notFound();

  const order = result.data as IOrder;
  const currentStepIndex = STATUS_STEPS.indexOf(order.status as OrderStatus);
  const isCancellable = ["pending", "confirmed"].includes(order.status);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 max-w-7xl">
      {/* Success banner */}
      {sp.success === "true" && (
        <div className="flex items-center gap-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
          <CheckCircle className="h-6 w-6 text-green-600 shrink-0" />
          <div>
            <p className="font-semibold text-green-800 dark:text-green-200">Order placed successfully!</p>
            <p className="text-sm text-green-700 dark:text-green-300">
              Your order <strong>{order.orderNumber}</strong> has been received and is being processed.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm"  className="mb-2 -ml-2">
            <Link href={`${base}/orders`}>
              <ArrowLeft className="h-4 w-4" /> Back to Orders
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Order {order.orderNumber}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={STATUS_COLORS[order.status as OrderStatus]}>{order.status}</Badge>
          {isCancellable && <CancelOrderButton orderId={orderId} base={base} />}
        </div>
      </div>

      {/* Progress tracker */}
      {!["cancelled", "refunded"].includes(order.status) && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {STATUS_STEPS.map((step, i) => {
                const isCompleted = i <= currentStepIndex;
                const isCurrent   = i === currentStepIndex;
                return (
                  <div key={step} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        isCompleted ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        {isCompleted ? "✓" : i + 1}
                      </div>
                      <span className={`text-xs capitalize hidden sm:block ${isCurrent ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                        {step}
                      </span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 ${i < currentStepIndex ? "bg-primary" : "bg-muted"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4" /> Order Items</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" sizes="56px" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium">{formatCurrency(item.subtotal)}</p>
                      <p className="text-xs text-muted-foreground">{item.quantity} × {formatCurrency(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" /> Shipping Address</CardTitle></CardHeader>
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
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Order Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatCurrency(order.tax)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{order.shipping === 0 ? <span className="text-green-600">Free</span> : formatCurrency(order.shipping)}</span></div>
              {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatCurrency(order.discount)}</span></div>}
              <Separator />
              <div className="flex justify-between font-bold text-base"><span>Total</span><span>{formatCurrency(order.total)}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4" /> Payment</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="capitalize">{order.paymentMethod.replace(/_/g, " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={order.paymentStatus === "paid" ? "success" : "warning"} className="text-xs">
                  {order.paymentStatus}
                </Badge>
              </div>
              {order.trackingNumber && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tracking</span>
                  <span className="font-mono text-xs">{order.trackingNumber}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
