// src/app/(store)/[storeSlug]/cart/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/store/cart-store";
import { formatCurrency } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { toast } from "sonner";

export default function StoreCartPage() {
  const params = useParams<{ storeSlug: string }>();
  const router = useRouter();
  const base = `/${params.storeSlug}`;
  const [isValidating, setIsValidating] = useState(false);
  const [invalidProducts, setInvalidProducts] = useState<string[]>([]);

  const { 
    items, 
    subtotal, 
    tax, 
    shipping, 
    discount, 
    total, 
    updateQuantity, 
    removeItem,
    clearCart,
    refreshCart 
  } = useCartStore();

  // ✅ التحقق من صحة المنتجات عند تحميل الصفحة
  useEffect(() => {
    refreshCart();
    validateProducts();
  }, []);

  const validateProducts = async () => {
    setIsValidating(true);
    const invalid: string[] = [];
    
    for (const item of items) {
      try {
        const res = await fetch(`/api/products/${item.productId}/validate`);
        const data = await res.json();
        if (!data.valid) {
          invalid.push(item.productId);
          // إزالة المنتج غير الصالح من السلة
          removeItem(item.productId);
        }
      } catch (error) {
        console.error(`Failed to validate product ${item.productId}:`, error);
      }
    }
    
    setInvalidProducts(invalid);
    if (invalid.length > 0) {
      toast.warning(`تمت إزالة ${invalid.length} منتج(منتجات) غير متوفرة من السلة`);
    }
    setIsValidating(false);
  };

  // ✅ تحديث السلة
  const handleRefresh = async () => {
    setIsValidating(true);
    await refreshCart();
    await validateProducts();
    setIsValidating(false);
  };

  if (isValidating) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <RefreshCw className="h-12 w-12 mx-auto text-orange-500 animate-spin mb-4" />
        <p className="text-gray-500">جاري التحقق من المنتجات...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">السلة فارغة</h1>
        <p className="text-gray-500 mb-6">أضف بعض المنتجات للبدء</p>
        <Button className="bg-orange-500 hover:bg-orange-600">
          <Link href={`${base}/products`}>
            متابعة التسوق <ArrowRight className="h-4 w-4 mr-2" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">سلة التسوق</h1>
        <Button variant="outline" onClick={handleRefresh} size="sm">
          <RefreshCw className="h-4 w-4 ml-2" />
          تحديث السلة
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.productId} className="flex gap-4 rounded-lg border bg-white p-4 shadow-sm">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {item.image ? (
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400">
                    📦
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div>
                    <Link href={`${base}/products/${item.slug}`}
                      className="font-medium text-gray-900 hover:text-orange-500 transition-colors">
                      {item.name}
                    </Link>
                    <p className="text-xs text-gray-400">SKU: {item.sku}</p>
                  </div>
                  <button 
                    onClick={() => {
                      removeItem(item.productId);
                      toast.success("تم إزالة المنتج من السلة");
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center rounded-lg border">
                    <button 
                      onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                      className="flex h-8 w-8 items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="flex h-8 w-10 items-center justify-center text-sm border-x">
                      {item.quantity}
                    </span>
                    <button 
                      onClick={() => updateQuantity(item.productId, Math.min(item.stock, item.quantity + 1))}
                      className="flex h-8 w-8 items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-orange-600">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                    <p className="text-xs text-gray-400">{formatCurrency(item.price)} للقطعة</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border bg-white p-6 space-y-4 sticky top-24 shadow-sm">
            <h2 className="font-bold text-lg text-gray-900">ملخص الطلب</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">المجموع الفرعي</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">الضريبة ({Math.round(siteConfig.tax.rate * 100)}%)</span>
                <span className="font-medium">{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">الشحن</span>
                <span className="font-medium">
                  {shipping === 0 ? 
                    <span className="text-green-600">مجاني</span> : 
                    formatCurrency(shipping)
                  }
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>خصم</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span className="text-gray-900">الإجمالي</span>
              <span className="text-orange-600">{formatCurrency(total)}</span>
            </div>
            {subtotal < siteConfig.shipping.freeThreshold && (
              <p className="text-xs text-gray-500 text-center">
                أضف {formatCurrency(siteConfig.shipping.freeThreshold - subtotal)} للحصول على شحن مجاني
              </p>
            )}
            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
              <Link href={`${base}/checkout`} className="flex items-center justify-center">
                متابعة الدفع <ArrowRight className="h-4 w-4 mr-2" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full">
              <Link href={`${base}/products`}>متابعة التسوق</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
