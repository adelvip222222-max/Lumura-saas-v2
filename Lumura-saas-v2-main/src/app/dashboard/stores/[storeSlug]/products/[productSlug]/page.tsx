// src/app/(store)/[storeSlug]/products/[productSlug]/page.tsx
import { notFound } from "next/navigation";
import { getStoreBySlug } from "@/lib/store/store-actions";
import { getStoreProductBySlug } from "@/lib/store/store-products";
import { getStoreCategories } from "@/lib/store/store-categories";
import { getStoreBrands } from "@/lib/store/store-brands";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Heart, Share2, Star, Truck, Shield, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Props {
  params: Promise<{
    storeSlug: string;
    productSlug: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { storeSlug, productSlug } = await params;
  const product = await getStoreProductBySlug(storeSlug, productSlug);
  
  if (!product) {
    return { title: "Product Not Found" };
  }
  
  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.images?.[0]?.url ? [product.images[0].url] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { storeSlug, productSlug } = await params;
  
  const store = await getStoreBySlug(storeSlug);
  if (!store) notFound();
  
  const product = await getStoreProductBySlug(storeSlug, productSlug);
  if (!product) notFound();
  
  const categories = await getStoreCategories(storeSlug);
  const brands = await getStoreBrands(storeSlug);
  
  // جلب المنتجات ذات الصلة (من نفس الفئة)
  const { getStoreProducts } = await import("@/lib/store/store-products");
  const { products: relatedProducts } = await getStoreProducts(storeSlug, {
    category: product.category?._id?.toString(),
    limit: 4,
  });
  
  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
  const hasDiscount = product.discountPrice && product.discountPrice < product.sellingPrice;
  const discountPercent = hasDiscount 
    ? Math.round(((product.sellingPrice - product.discountPrice) / product.sellingPrice) * 100)
    : 0;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href={`/${storeSlug}`} className="hover:text-orange-500">الرئيسية</Link>
          <span>/</span>
          <Link href={`/${storeSlug}/products`} className="hover:text-orange-500">المنتجات</Link>
          <span>/</span>
          {product.category && (
            <>
              <Link href={`/${storeSlug}/categories/${product.category.slug}`} className="hover:text-orange-500">
                {product.category.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-gray-900 font-medium">{product.name}</span>
        </nav>
        
        {/* Product Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 p-6">
            {/* Product Images */}
            <div>
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {primaryImage ? (
                  <img
                    src={primaryImage.url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>
              {product.images && product.images.length > 1 && (
                <div className="flex gap-2 mt-4">
                  {product.images.slice(0, 4).map((img, idx) => (
                    <div key={idx} className="w-20 h-20 rounded-lg border overflow-hidden cursor-pointer hover:border-orange-500">
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Product Info */}
            <div>
              {/* Badges */}
              <div className="flex gap-2 mb-4">
                {product.isFeatured && (
                  <Badge className="bg-orange-500">مميز</Badge>
                )}
                {hasDiscount && (
                  <Badge variant="destructive">خصم {discountPercent}%</Badge>
                )}
                {product.stockQuantity === 0 && (
                  <Badge variant="secondary">نفد من المخزون</Badge>
                )}
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              
              {product.brand && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-gray-500">العلامة التجارية:</span>
                  <Link href={`/${storeSlug}/brands/${product.brand.slug}`} className="text-sm text-orange-500 hover:underline">
                    {product.brand.name}
                  </Link>
                </div>
              )}
              
              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= (product.averageRating || 0)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500">
                  ({product.reviewCount || 0} تقييمات)
                </span>
              </div>
              
              {/* Price */}
              <div className="mb-6">
                {hasDiscount ? (
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-orange-500">
                      {product.discountPrice?.toLocaleString()} ج.م
                    </span>
                    <span className="text-lg text-gray-400 line-through">
                      {product.sellingPrice.toLocaleString()} ج.م
                    </span>
                  </div>
                ) : (
                  <span className="text-3xl font-bold text-orange-500">
                    {product.sellingPrice.toLocaleString()} ج.م
                  </span>
                )}
              </div>
              
              {/* Short Description */}
              <p className="text-gray-600 mb-6 leading-relaxed">
                {product.shortDescription || product.description?.substring(0, 200)}
              </p>
              
              {/* Stock Status */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">المخزون المتاح:</span>
                  <span className={`font-semibold ${
                    product.stockQuantity > 10 ? "text-green-600" :
                    product.stockQuantity > 0 ? "text-yellow-600" : "text-red-600"
                  }`}>
                    {product.stockQuantity > 0 ? `${product.stockQuantity} قطعة` : "نفد من المخزون"}
                  </span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-4">
                <Button 
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-lg py-6"
                  disabled={product.stockQuantity === 0}
                >
                  <ShoppingCart className="w-5 h-5 ml-2" />
                  أضف إلى السلة
                </Button>
                <Button variant="outline" className="px-4">
                  <Heart className="w-5 h-5" />
                </Button>
                <Button variant="outline" className="px-4">
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Benefits */}
              <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t">
                <div className="text-center">
                  <Truck className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">شحن سريع</p>
                </div>
                <div className="text-center">
                  <Shield className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">ضمان الجودة</p>
                </div>
                <div className="text-center">
                  <RefreshCw className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">استرجاع خلال 14 يوم</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Product Details Tabs */}
          <div className="border-t p-6">
            <div className="flex gap-6 border-b mb-6">
              <button className="pb-3 text-orange-500 border-b-2 border-orange-500 font-medium">
                الوصف
              </button>
              <button className="pb-3 text-gray-500 hover:text-gray-700">
                المواصفات
              </button>
              <button className="pb-3 text-gray-500 hover:text-gray-700">
                التقييمات ({product.reviewCount || 0})
              </button>
            </div>
            
            <div className="prose max-w-none">
              <p className="text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>
            
            {/* Specifications */}
            {product.specifications && product.specifications.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-4">المواصفات</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {product.specifications.map((spec, idx) => (
                    <div key={idx} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700 w-32">{spec.key}:</span>
                      <span className="text-gray-600">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">منتجات ذات صلة</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.filter(p => p._id !== product._id).map((relatedProduct: any) => (
                <Link
                  key={relatedProduct._id}
                  href={`/${storeSlug}/products/${relatedProduct.slug}`}
                  className="bg-white rounded-lg border overflow-hidden hover:shadow-lg transition"
                >
                  <div className="aspect-square bg-gray-100">
                    {relatedProduct.images?.[0] && (
                      <img
                        src={relatedProduct.images[0].url}
                        alt={relatedProduct.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
                      {relatedProduct.name}
                    </h3>
                    <p className="text-orange-500 font-bold mt-2">
                      {relatedProduct.sellingPrice.toLocaleString()} ج.م
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}