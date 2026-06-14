"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CheckCircle, CreditCard, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/store/cart-store";
import { createOrderAction } from "@/actions/orders";
import { createOrderSchema, type CreateOrderInput } from "@/schemas/order";
import { formatCurrency } from "@/lib/utils";

export default function StoreCheckoutPage() {
  const router  = useRouter();
  const params  = useParams<{ storeSlug: string }>();
  const base    = `/${params.storeSlug}`;
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash_on_delivery" | "stripe">("cash_on_delivery");

  const { items, subtotal, tax, shipping, discount, total, clearCart, refreshCart } = useCartStore();

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const { register, handleSubmit, formState: { errors } } = useForm<CreateOrderInput>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: { paymentMethod: "cash_on_delivery" },
  });

// src/app/(store)/[storeSlug]/checkout/page.tsx (الجزء المعدل)
// src/app/(store)/[storeSlug]/checkout/page.tsx (الجزء المعدل)

const onSubmit = async (data: CreateOrderInput) => {
  if (items.length === 0) { 
    toast.error("السلة فارغة"); 
    return; 
  }
  
  setIsLoading(true);
  
  try {
    // ✅ التأكد من أن العناصر تحتوي على productId صحيح
    const validItems = items.filter(item => item.productId);
    if (validItems.length !== items.length) {
      toast.error("بعض المنتجات غير صالحة. يرجى تحديث الصفحة");
      setIsLoading(false);
      return;
    }
    
    const result = await createOrderAction({ 
      ...data, 
      paymentMethod,
      items: validItems.map(item => ({
        productId: item.productId,
        name: item.name,
        slug: item.slug,
        image: item.image,
        sku: item.sku,
        price: item.price,
        quantity: item.quantity,
      })),
      subtotal,
      tax,
      shipping,
      discount,
      total,
      storeSlug: params.storeSlug,
    });

    if (!result.success) { 
      toast.error(result.error ?? "فشل إنشاء الطلب");
      
      if (result.error?.includes("غير موجود")) {
        // ✅ اقتراح تفريغ السلة
        toast.info("بعض المنتجات غير متوفرة حالياً. يرجى تحديث السلة", {
          duration: 5000,
          action: {
            label: "تحديث السلة",
            onClick: () => router.push(`/${params.storeSlug}/cart`),
          },
        });
      }
      return; 
    }

    if (paymentMethod === "stripe" && result.data?.checkoutUrl) {
      window.location.href = result.data.checkoutUrl;
      return;
    }

    clearCart();
    toast.success("تم إنشاء الطلب بنجاح!");
    router.push(`/${params.storeSlug}/orders/${result.data?.orderId}?success=true`);
  } catch (error) {
    toast.error("حدث خطأ ما. يرجى المحاولة مرة أخرى.");
  } finally {
    setIsLoading(false);
  }
};

  if (items.length === 0) { router.push(`${base}/cart`); return null; }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping */}
            <div className="rounded-lg border bg-card p-6 space-y-4">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Truck className="h-5 w-5" /> Shipping Address
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Full Name <span className="text-destructive">*</span></label>
                  <Input {...register("shippingAddress.fullName")} placeholder="John Doe" />
                  {errors.shippingAddress?.fullName && <p className="text-xs text-destructive">{errors.shippingAddress.fullName.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Phone <span className="text-destructive">*</span></label>
                  <Input {...register("shippingAddress.phone")} placeholder="+1 234 567 8900" />
                  {errors.shippingAddress?.phone && <p className="text-xs text-destructive">{errors.shippingAddress.phone.message}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Street Address <span className="text-destructive">*</span></label>
                <Input {...register("shippingAddress.street")} placeholder="123 Main Street" />
                {errors.shippingAddress?.street && <p className="text-xs text-destructive">{errors.shippingAddress.street.message}</p>}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">City <span className="text-destructive">*</span></label>
                  <Input {...register("shippingAddress.city")} placeholder="New York" />
                  {errors.shippingAddress?.city && <p className="text-xs text-destructive">{errors.shippingAddress.city.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">State <span className="text-destructive">*</span></label>
                  <Input {...register("shippingAddress.state")} placeholder="NY" />
                  {errors.shippingAddress?.state && <p className="text-xs text-destructive">{errors.shippingAddress.state.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">ZIP Code <span className="text-destructive">*</span></label>
                  <Input {...register("shippingAddress.zipCode")} placeholder="10001" />
                  {errors.shippingAddress?.zipCode && <p className="text-xs text-destructive">{errors.shippingAddress.zipCode.message}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Country <span className="text-destructive">*</span></label>
                <Input {...register("shippingAddress.country")} placeholder="United States" />
                {errors.shippingAddress?.country && <p className="text-xs text-destructive">{errors.shippingAddress.country.message}</p>}
              </div>
            </div>

            {/* Payment */}
            <div className="rounded-lg border bg-card p-6 space-y-4">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" /> Payment Method
              </h2>
              <div className="space-y-3">
                {/* خيار الدفع عند الاستلام */}
                <label className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition hover:bg-muted/50 ${paymentMethod === "cash_on_delivery" ? "border-orange-500 bg-orange-50/10" : ""}`}>
                  <input type="radio" name="paymentMethod" value="cash_on_delivery"
                    checked={paymentMethod === "cash_on_delivery"}
                    onChange={() => setPaymentMethod("cash_on_delivery")} className="h-4 w-4 accent-orange-500" />
                  <div>
                    <p className="font-medium">Cash on Delivery</p>
                    <p className="text-sm text-muted-foreground">Pay when your order arrives</p>
                  </div>
                </label>
                
                {/* خيار الدفع بالفيزا / سترايب (تم تفعيله بالكامل) */}
                <label className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition hover:bg-muted/50 ${paymentMethod === "stripe" ? "border-orange-500 bg-orange-50/10" : ""}`}>
                  <input type="radio" name="paymentMethod" value="stripe"
                    checked={paymentMethod === "stripe"}
                    onChange={() => setPaymentMethod("stripe")} className="h-4 w-4 accent-orange-500" />
                  <div>
                    <p className="font-medium">Credit / Debit Card (Visa/Mastercard)</p>
                    <p className="text-sm text-muted-foreground">Pay securely via Stripe</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div className="rounded-lg border bg-card p-6">
              <h2 className="font-bold text-lg mb-4">Order Notes (Optional)</h2>
              <textarea {...register("notes")} rows={3} placeholder="Any special instructions..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="rounded-lg border bg-card p-6 space-y-4 sticky top-24">
              <h2 className="font-bold text-lg">Order Summary</h2>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.name} × {item.quantity}</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{shipping === 0 ? <span className="text-green-600">Free</span> : formatCurrency(shipping)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white" size="lg" disabled={isLoading}>
                <CheckCircle className="h-4 w-4 ml-2" /> {paymentMethod === "stripe" ? "Proceed to Payment" : "Place Order"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                By placing your order you agree to our Terms of Service
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
