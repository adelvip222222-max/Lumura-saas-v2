// src/components/store/FeaturedProducts.tsx
import Link from "next/link";

interface Product {
  _id: string;
  name: string;
  slug: string;
  sellingPrice: number;
  images: { url: string; isPrimary: boolean }[];
}

interface FeaturedProductsProps {
  products: Product[];
  storeSlug: string;
}

export default function FeaturedProducts({ products, storeSlug }: FeaturedProductsProps) {
  const featuredProducts = products.filter(p => (p as any).isFeatured).slice(0, 4);
  
  if (featuredProducts.length === 0) return null;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">منتجات مميزة</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {featuredProducts.map((product) => (
          <Link
            key={product._id}
            href={`/${storeSlug}/products/${product.slug}`}
            className="bg-white border rounded-lg overflow-hidden hover:shadow-lg transition"
          >
            <div className="aspect-square bg-gray-100">
              {product.images?.[0] && (
                <img
                  src={product.images[0].url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="p-3">
              <h3 className="font-medium text-gray-800 text-sm line-clamp-2">
                {product.name}
              </h3>
              <p className="text-orange-500 font-bold mt-1">
                {product.sellingPrice.toLocaleString()} ج.م
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
