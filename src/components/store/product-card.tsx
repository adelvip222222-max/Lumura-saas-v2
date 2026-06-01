"use client";

import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/store/cart-store";

interface ProductCardProps {
  product: any;
  storeSlug: string;
}

export function ProductCard({ product, storeSlug }: ProductCardProps) {
  const { addItem } = useCartStore();

  const primaryImage = product.images?.find((img: any) => img.isPrimary) || product.images?.[0];
  const hasDiscount = product.discountPrice && product.discountPrice < product.sellingPrice;
  const discountPercent = hasDiscount
    ? Math.round(((product.sellingPrice - product.discountPrice) / product.sellingPrice) * 100)
    : 0;
  const currentPrice = hasDiscount ? product.discountPrice : product.sellingPrice;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stockQuantity <= 0) {
      toast.error("هذا المنتج غير متوفر حاليًا");
      return;
    }

    addItem({
      productId: product._id,
      name: product.name,
      slug: product.slug,
      price: currentPrice,
      quantity: 1,
      image: primaryImage?.url || "",
      sku: product.sku,
      stock: product.stockQuantity,
    });

    toast.success("تمت إضافة المنتج إلى السلة");
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast.success("تمت إضافة المنتج إلى المفضلة");
  };

  return (
    <article className="group relative flex h-full flex-col bg-white">
      <div className="pointer-events-none absolute left-3 right-3 top-3 z-10 flex items-start justify-between">
        {hasDiscount ? (
          <span className="bg-white px-2.5 py-1 text-xs font-black text-red-500 shadow-sm">
            -{discountPercent}%
          </span>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={handleFavorite}
          className="pointer-events-auto grid h-9 w-9 place-items-center rounded-full bg-white text-slate-400 opacity-0 shadow-sm transition group-hover:opacity-100 hover:text-red-500"
          aria-label="Add to wishlist"
        >
          <Heart className="h-4 w-4" />
        </button>
      </div>

      <Link
        href={`/${storeSlug}/products/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-slate-50"
      >
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={product.name}
            className="h-full w-full object-contain p-6 transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-slate-300">
            <ShoppingCart className="h-12 w-12" />
          </div>
        )}

        <div className="absolute inset-x-4 bottom-4 translate-y-3 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={product.stockQuantity <= 0}
            className={`h-11 w-full text-sm font-black uppercase tracking-wide text-white transition ${
              product.stockQuantity <= 0
                ? "cursor-not-allowed bg-slate-300"
                : "bg-slate-950 hover:bg-[var(--store-primary)]"
            }`}
          >
            {product.stockQuantity <= 0 ? "غير متوفر" : "أضف للسلة"}
          </button>
        </div>
      </Link>

      <div className="flex flex-1 flex-col pt-4 text-center">
        <Link href={`/${storeSlug}/products/${product.slug}`}>
          <h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-slate-800 transition group-hover:text-[var(--store-primary)]">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto pt-2">
          <div className="flex items-center justify-center gap-2">
            <span className="text-base font-black text-slate-950">
              {currentPrice.toLocaleString()} ج.م
            </span>
            {hasDiscount && (
              <span className="text-sm text-slate-400 line-through">
                {product.sellingPrice.toLocaleString()} ج.م
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
