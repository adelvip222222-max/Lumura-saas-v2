"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import type { StorePublicTheme } from "@/lib/store/store-theme";

export function CartDropdown({ theme }: { theme: StorePublicTheme }) {
  const isAr = theme.language === "ar";
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const {
    items,
    subtotal,
    tax,
    shipping,
    total,
    updateQuantity,
    removeItem,
    refreshCart,
    totalItems,
  } = useCartStore();

  const count = totalItems();
  const sideClass = isAr ? "left-0" : "right-0";

  const labels = useMemo(
    () => ({
      title: isAr ? "سلة التسوق" : "Shopping Cart",
      empty: isAr ? "السلة فارغة" : "Your cart is empty",
      subtotal: isAr ? "المجموع الفرعي" : "Subtotal",
      tax: isAr ? "الضريبة" : "Tax",
      shipping: isAr ? "الشحن" : "Shipping",
      free: isAr ? "مجاني" : "Free",
      total: isAr ? "الإجمالي" : "Total",
      cart: isAr ? "عرض السلة" : "View Cart",
      checkout: isAr ? "إتمام الدفع" : "Checkout",
      continue: isAr ? "تصفح المنتجات" : "Browse Products",
      item: isAr ? "للقطعة" : "each",
      remove: isAr ? "حذف المنتج" : "Remove item",
      close: isAr ? "إغلاق" : "Close",
    }),
    [isAr]
  );

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="relative grid h-10 w-10 place-items-center rounded-full text-slate-700 transition hover:bg-slate-100 hover:text-[var(--store-primary)]"
        title={labels.title}
        aria-label={labels.title}
        aria-expanded={isOpen}
      >
        <ShoppingCart className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-[var(--store-primary)] px-1 text-[11px] font-black leading-none text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute ${sideClass} top-full z-50 mt-3 w-[min(92vw,27rem)] overflow-hidden rounded-md border border-slate-200 bg-white text-slate-950 shadow-2xl`}
          dir={isAr ? "rtl" : "ltr"}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-black">{labels.title}</p>
              <p className="text-xs text-slate-500">{count} {isAr ? "منتج" : "items"}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label={labels.close}
              title={labels.close}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {items.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <ShoppingCart className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-bold text-slate-700">{labels.empty}</p>
              <Link
                href={`/${theme.slug}/products`}
                onClick={() => setIsOpen(false)}
                className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-[var(--store-primary)]"
              >
                {labels.continue}
              </Link>
            </div>
          ) : (
            <>
              <div className="max-h-[22rem] overflow-y-auto p-3">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="grid grid-cols-[4.5rem_1fr_auto] gap-3 border-b border-slate-100 py-3 last:border-b-0"
                  >
                    <Link
                      href={`/${theme.slug}/products/${item.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="relative h-[4.5rem] w-[4.5rem] overflow-hidden rounded-md bg-slate-100"
                    >
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="72px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="grid h-full w-full place-items-center text-xs text-slate-400">
                          IMG
                        </span>
                      )}
                    </Link>

                    <div className="min-w-0">
                      <Link
                        href={`/${theme.slug}/products/${item.slug}`}
                        onClick={() => setIsOpen(false)}
                        className="line-clamp-2 text-sm font-bold leading-5 text-slate-900 hover:text-[var(--store-primary)]"
                      >
                        {item.name}
                      </Link>
                      {item.sku && <p className="mt-1 text-xs text-slate-400">SKU: {item.sku}</p>}
                      <p className="mt-2 text-sm font-black text-[var(--store-primary)]">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatCurrency(item.price)} {labels.item}
                      </p>
                    </div>

                    <div className="flex flex-col items-end justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                        aria-label={labels.remove}
                        title={labels.remove}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="flex h-8 overflow-hidden rounded-md border border-slate-200">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="grid w-8 place-items-center hover:bg-slate-50"
                          aria-label="-"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="grid w-9 place-items-center border-x border-slate-200 text-sm font-bold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="grid w-8 place-items-center hover:bg-slate-50"
                          aria-label="+"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t border-slate-100 bg-slate-50 px-4 py-4">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{labels.subtotal}</span>
                    <span className="font-bold">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{labels.tax}</span>
                    <span className="font-bold">{formatCurrency(tax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{labels.shipping}</span>
                    <span className="font-bold">
                      {shipping === 0 ? labels.free : formatCurrency(shipping)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-black">
                  <span>{labels.total}</span>
                  <span className="text-[var(--store-primary)]">{formatCurrency(total)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={`/${theme.slug}/cart`}
                    onClick={() => setIsOpen(false)}
                    className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white text-sm font-bold text-slate-800 transition hover:border-[var(--store-primary)] hover:text-[var(--store-primary)]"
                  >
                    {labels.cart}
                  </Link>
                  <Link
                    href={`/${theme.slug}/checkout`}
                    onClick={() => setIsOpen(false)}
                    className="inline-flex h-10 items-center justify-center rounded-md bg-[var(--store-primary)] text-sm font-bold text-white transition hover:brightness-95"
                  >
                    {labels.checkout}
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
