"use client";

import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/store/cart-store";
import { useStoreTheme } from "@/components/store-front/store-theme-shell";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: any;
  storeSlug: string;
}

const cardClasses = {
  classic: "rounded-[var(--store-radius)] border border-slate-100 bg-white p-3 shadow-sm hover:shadow-xl",
  compact: "rounded-xl border border-slate-100 bg-white p-2 shadow-sm hover:shadow-lg",
  editorial: "rounded-none border-0 bg-white p-0 shadow-none hover:-translate-y-1",
  masonry: "rounded-[calc(var(--store-radius)+10px)] border border-white/70 bg-white/85 p-3 shadow-sm backdrop-blur hover:shadow-xl",
} as const;

const imageClasses = {
  classic: "rounded-[calc(var(--store-radius)-4px)] bg-slate-50",
  compact: "rounded-lg bg-slate-50",
  editorial: "rounded-none bg-slate-100",
  masonry: "rounded-[calc(var(--store-radius)+4px)] bg-[var(--store-primary-muted)]",
} as const;

function getCurrencyLabel(currency: string) {
  switch (currency) {
    case "USD":
      return "$";
    case "SAR":
      return "ر.س";
    case "AED":
      return "د.إ";
    default:
      return "ج.م";
  }
}

export function ProductCard({ product, storeSlug }: ProductCardProps) {
  const { addItem } = useCartStore();
  const theme = useStoreTheme();
  const isAr = theme.language === "ar";
  const gridStyle = theme.productGridStyle;
  const currency = getCurrencyLabel(theme.currency);

  const primaryImage = product.images?.find((img: any) => img.isPrimary) || product.images?.[0];
  const hasDiscount = product.discountPrice && product.discountPrice < product.sellingPrice;
  const discountPercent = hasDiscount
    ? Math.round(((product.sellingPrice - product.discountPrice) / product.sellingPrice) * 100)
    : 0;
  const currentPrice = hasDiscount ? product.discountPrice : product.sellingPrice;
  const isCompact = gridStyle === "compact";
  const isEditorial = gridStyle === "editorial";

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stockQuantity <= 0) {
      toast.error(isAr ? "هذا المنتج غير متوفر حاليًا" : "This product is out of stock");
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

    toast.success(isAr ? "تمت إضافة المنتج إلى السلة" : "Product added to cart");
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast.success(isAr ? "تمت إضافة المنتج إلى المفضلة" : "Product added to wishlist");
  };

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col transition-all duration-300",
        cardClasses[gridStyle]
      )}
    >
      <div className="pointer-events-none absolute left-3 right-3 top-3 z-10 flex items-start justify-between">
        {hasDiscount ? (
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-black text-red-500 shadow-sm backdrop-blur">
            -{discountPercent}%
          </span>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={handleFavorite}
          className={cn(
            "pointer-events-auto grid place-items-center rounded-full bg-white/90 text-slate-400 shadow-sm backdrop-blur transition hover:text-red-500",
            isCompact ? "h-8 w-8" : "h-9 w-9",
            isEditorial ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
          aria-label={isAr ? "إضافة للمفضلة" : "Add to wishlist"}
        >
          <Heart className={isCompact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </button>
      </div>

      <Link
        href={`/${storeSlug}/products/${product.slug}`}
        className={cn(
          "relative block overflow-hidden",
          isEditorial ? "aspect-[4/5]" : "aspect-square",
          imageClasses[gridStyle]
        )}
      >
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={product.name}
            className={cn(
              "h-full w-full object-contain transition duration-500 group-hover:scale-105",
              isCompact ? "p-3" : "p-6",
              isEditorial && "object-cover p-0"
            )}
          />
        ) : (
          <div className="grid h-full place-items-center text-slate-300">
            <ShoppingCart className={isCompact ? "h-9 w-9" : "h-12 w-12"} />
          </div>
        )}

        <div className={cn(
          "absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100",
          isCompact && "hidden sm:block"
        )}>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={product.stockQuantity <= 0}
            className={cn(
              "w-full rounded-[calc(var(--store-radius)-6px)] text-xs font-black uppercase tracking-wide text-white transition",
              isCompact ? "h-9" : "h-11",
              product.stockQuantity <= 0
                ? "cursor-not-allowed bg-slate-300"
                : "bg-slate-950 hover:bg-[var(--store-primary)]"
            )}
          >
            {product.stockQuantity <= 0 ? (isAr ? "غير متوفر" : "Out of stock") : (isAr ? "أضف للسلة" : "Add to cart")}
          </button>
        </div>
      </Link>

      <div className={cn("flex flex-1 flex-col", isCompact ? "pt-2 text-start" : "pt-4 text-center", isEditorial && "px-2 text-start")}>
        <Link href={`/${storeSlug}/products/${product.slug}`}>
          <h3
            className={cn(
              "line-clamp-2 font-bold leading-5 text-slate-800 transition group-hover:text-[var(--store-primary)]",
              isCompact ? "min-h-9 text-xs" : "min-h-10 text-sm"
            )}
          >
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto pt-2">
          <div className={cn("flex flex-wrap items-center gap-2", isCompact || isEditorial ? "justify-start" : "justify-center")}>
            <span className={cn("font-black text-slate-950", isCompact ? "text-sm" : "text-base")}>
              {currentPrice.toLocaleString(isAr ? "ar-EG" : "en-US")} {currency}
            </span>
            {hasDiscount && (
              <span className="text-xs text-slate-400 line-through">
                {product.sellingPrice.toLocaleString(isAr ? "ar-EG" : "en-US")} {currency}
              </span>
            )}
          </div>
        </div>

        {isCompact && (
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={product.stockQuantity <= 0}
            className="mt-3 inline-flex h-9 items-center justify-center rounded-lg bg-slate-950 px-3 text-xs font-black text-white transition hover:bg-[var(--store-primary)] disabled:cursor-not-allowed disabled:bg-slate-300 sm:hidden"
          >
            {isAr ? "أضف للسلة" : "Add"}
          </button>
        )}
      </div>
    </article>
  );
}
