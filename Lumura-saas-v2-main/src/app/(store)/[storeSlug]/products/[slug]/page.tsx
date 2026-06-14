import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Heart, Star } from "lucide-react";
import { getStoreProductBySlug, getStoreProducts } from "@/lib/store/store-products";
import { serializeMongoDoc } from "@/lib/utils/serialize";
import { ProductActions } from "@/components/store/product-actions";
import { ProductCard } from "@/components/store/product-card";
import { formatCurrency } from "@/lib/utils";

interface Props {
  params: Promise<{ storeSlug: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { storeSlug, slug } = await params;
  const product = await getStoreProductBySlug(storeSlug, slug);
  if (!product) return { title: "Product Not Found" };
  return {
    title: product.name,
    description: product.shortDescription ?? product.description?.slice(0, 160),
  };
}

export default async function StoreProductPage({ params }: Props) {
  const { storeSlug, slug } = await params;
  const rawProduct = await getStoreProductBySlug(storeSlug, slug);
  if (!rawProduct) notFound();
  const product = serializeMongoDoc(rawProduct) as typeof rawProduct;

  const categoryId =
    typeof product.category === "object" && product.category !== null
      ? String((product.category as { _id?: string })._id ?? "")
      : String(product.category ?? "");

  const related = await getStoreProducts(storeSlug, {
    isActive: true,
    category: categoryId || undefined,
    limit: 4,
    page: 1,
  });

  const image =
    product.thumbnail ||
    product.images?.find((item: any) => item.isPrimary)?.url ||
    product.images?.[0]?.url ||
    "/placeholder.png";
  const price = product.discountPrice ?? product.sellingPrice;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff3e5] via-white to-[#ffe5c8]">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <Link href={`/${storeSlug}/products`} className="rounded-full bg-white p-3 shadow-sm">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <p className="font-serif text-xl font-black">Product details</p>
          <button className="rounded-full bg-white p-3 text-orange-600 shadow-sm">
            <Heart className="h-5 w-5 fill-current" />
          </button>
        </div>

        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="overflow-hidden rounded-[30px] bg-white p-6 shadow-xl">
            <div className="relative aspect-[1.2] rounded-[24px] bg-[#fff1e4]">
              <Image src={image} alt={product.name} fill priority className="object-contain p-8" sizes="(max-width: 1024px) 100vw, 55vw" />
            </div>
            {product.images?.length > 1 && (
              <div className="mt-4 flex justify-center gap-2">
                {product.images.slice(0, 5).map((item: any) => (
                  <span key={item.url} className="h-2.5 w-2.5 rounded-full bg-slate-300 first:bg-slate-950" />
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[30px] bg-white p-6 shadow-xl lg:p-8">
            <div className="mb-4 flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 fill-orange-400 text-orange-400" />
              <span className="font-bold">{(product.averageRating || 4).toFixed(1)}</span>
              <span className="text-slate-500">({product.reviewCount || 0} reviews)</span>
            </div>

            <div className="flex items-start justify-between gap-4">
              <h1 className="font-serif text-3xl font-black text-slate-950">{product.name}</h1>
              <div className="text-right">
                {product.discountPrice && (
                  <p className="text-sm text-slate-400 line-through">{formatCurrency(product.sellingPrice)}</p>
                )}
                <p className="text-3xl font-black text-slate-950">{formatCurrency(price)}</p>
              </div>
            </div>

            <p className="mt-5 leading-relaxed text-slate-600">
              {product.shortDescription || product.description}
            </p>

            <div className="mt-6">
              <p className="mb-3 font-bold">Colors</p>
              <div className="flex gap-3">
                <span className="h-8 w-8 rounded-full border-2 border-white bg-slate-800 ring-2 ring-slate-800" />
                <span className="h-8 w-8 rounded-full bg-black" />
                <span className="h-8 w-8 rounded-full bg-violet-500" />
                <span className="h-8 w-8 rounded-full bg-slate-400" />
              </div>
            </div>

            <div className="mt-10">
              <ProductActions
                product={{
                  id: String(product._id),
                  name: product.name,
                  slug: product.slug,
                  image,
                  price,
                  stock: product.stockQuantity,
                  sku: product.sku,
                }}
              />
            </div>
          </div>
        </section>

        {product.specifications?.length > 0 && (
          <section className="mt-8 rounded-[24px] bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-serif text-2xl font-black">Specifications</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {product.specifications.map((spec: any) => (
                <div key={spec.key} className="rounded-2xl bg-orange-50 px-4 py-3 text-sm">
                  <span className="font-bold">{spec.key}: </span>
                  <span className="text-slate-600">{spec.value}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-10">
          <h2 className="mb-5 font-serif text-2xl font-black">Related products</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.products
              .filter((item: { _id: string }) => String(item._id) !== String(product._id))
              .slice(0, 4)
              .map((item) => (
                <ProductCard key={String(item._id)} product={item} storeSlug={storeSlug} />
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}
