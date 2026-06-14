// src/components/store/product-card.tsx
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
  // ✅ تفعيل دوال الستور
  const { addItem } = useCartStore();

  const primaryImage = product.images?.find((img: any) => img.isPrimary) || product.images?.[0];
  const hasDiscount = product.discountPrice && product.discountPrice < product.sellingPrice;
  const discountPercent = hasDiscount 
    ? Math.round(((product.sellingPrice - product.discountPrice) / product.sellingPrice) * 100)
    : 0;
  
  // ✅ سعر المنتج (بعد الخصم)
  const currentPrice = hasDiscount ? product.discountPrice : product.sellingPrice;

  // ✅ دالة الإضافة للسلة
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // التحقق من توفر المنتج
    if (product.stockQuantity <= 0) {
      toast.error("عذراً، هذا المنتج غير متوفر حالياً");
      return;
    }
    
    // إضافة المنتج إلى السلة
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
    
    toast.success("تم إضافة المنتج إلى السلة بنجاح! 🛒");
  };

  // ✅ دالة الإضافة للمفضلة
  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // هنا يمكن إضافة منطق المفضلة
    // يمكنك استخدام API أو Store منفصل للمفضلة
    
    toast.success("تم إضافة المنتج إلى المفضلة! ❤️");
    
    // مثال لإرسال طلب إلى API
    // try {
    //   const res = await fetch("/api/wishlist", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ productId: product._id }),
    //   });
    //   if (res.ok) toast.success("تم إضافة المنتج إلى المفضلة");
    // } catch (error) {
    //   toast.error("حدث خطأ");
    // }
  };

  return (
    <div className="group relative bg-white rounded-3xl p-3 shadow-sm border border-gray-50 flex flex-col h-full hover:shadow-xl hover:border-orange-100 transition-all duration-300">
      
      {/* Top Badges & Actions */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10 pointer-events-none">
        {hasDiscount ? (
          <span className="bg-white/80 backdrop-blur-sm text-red-500 font-bold text-xs px-2 py-1 rounded-md shadow-sm">
            -{discountPercent}%
          </span>
        ) : <div></div>}
        
        {/* زر المفضلة */}
        <button 
          onClick={handleFavorite}
          className="text-gray-300 hover:text-orange-500 pointer-events-auto transition-colors bg-white/50 backdrop-blur-sm p-1.5 rounded-full z-20"
        >
          <Heart className="w-5 h-5" />
        </button>
      </div>

      {/* Product Image */}
      <Link href={`/${storeSlug}/products/${product.slug}`} className="block relative aspect-square mb-4 mt-2 overflow-hidden rounded-2xl bg-gray-50 flex items-center justify-center">
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 p-4"
          />
        ) : (
          <div className="text-4xl text-gray-300">📦</div>
        )}
      </Link>

      {/* Product Details */}
      <div className="flex flex-col flex-1">
        <Link href={`/${storeSlug}/products/${product.slug}`}>
          <h3 className="font-medium text-gray-800 text-sm mb-1 line-clamp-2 group-hover:text-orange-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        
        <div className="mt-auto pt-3 flex items-end justify-between">
          <div className="flex flex-col">
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through mb-0.5">
                {product.sellingPrice.toLocaleString()} ج.م
              </span>
            )}
            <span className="text-lg font-bold text-gray-900">
              {currentPrice.toLocaleString()} ج.م
            </span>
          </div>
          
          {/* زر السلة */}
          <button 
            onClick={handleAddToCart}
            disabled={product.stockQuantity <= 0}
            className={`p-2.5 rounded-xl transition-colors shadow-sm z-20 relative ${
              product.stockQuantity <= 0 
                ? "bg-gray-300 cursor-not-allowed" 
                : "bg-gray-900 hover:bg-orange-500 text-white"
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}