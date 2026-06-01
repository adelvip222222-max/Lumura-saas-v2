import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { ChevronRight, ExternalLink } from "lucide-react";
import { connectToDatabase } from "@/lib/db/mongodb";
import Brand from "@/models/Brand";
import Store from "@/models/Store";
import { getStoreProducts } from "@/lib/store/store-products";
import { ProductCard } from "@/components/store/product-card";
import { ProductGridSkeleton } from "@/components/store/product-card-skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { serialize } from "@/lib/serialize";
import type { IBrand } from "@/models/Brand";
import type { IProduct } from "@/models/Product";

interface Props {
  params:      Promise<{ storeSlug: string; brandSlug: string }>;
  searchParams: Promise<{ sortBy?: string; page?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { storeSlug, brandSlug } = await params;
  await connectToDatabase();
  const store = await Store.findOne({ slug: storeSlug }).select("_id tenantId").lean();
  const brand = store
    ? await Brand.findOne({ slug: brandSlug, storeId: store._id, tenantId: store.tenantId, isActive: true }).lean()
    : null;
  if (!brand) return { title: "Brand" };
  return {
    title:       brand.metaTitle ?? brand.name,
    description: brand.metaDescription ?? brand.description,
  };
}

async function BrandProducts({
  brandId, brandSlug, sortBy, page, storeSlug,
}: {
  brandId: string; brandSlug: string; sortBy?: string; page: number; storeSlug: string;
}) {
  const result = await getStoreProducts(storeSlug, {
    brand:  brandId,
    page,
    limit:  12,
    isActive: true,
  });

  const { products, pagination } = result;
  const base = `/${storeSlug}/brands/${brandSlug}`;

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-3">📦</p>
        <p className="font-semibold">No products found for this brand</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{pagination.total} products</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p._id.toString()} product={p as unknown as IProduct} storeSlug={storeSlug} />
        ))}
      </div>
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          {pagination.page > 1 && (
            <Button variant="outline" size="sm" >
              <Link href={`${base}?page=${pagination.page - 1}${sortBy ? `&sortBy=${sortBy}` : ""}`}>
                Previous
              </Link>
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            {pagination.page} / {pagination.pages}
          </span>
          {pagination.page < pagination.pages && (
            <Button >
              <Link href={`${base}?page=${pagination.page + 1}${sortBy ? `&sortBy=${sortBy}` : ""}`}>
                Next
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default async function StoreBrandPage({ params, searchParams }: Props) {
  const { storeSlug, brandSlug } = await params;
  const sp   = await searchParams;
  const base = `/${storeSlug}`;

  await connectToDatabase();
  const store = await Store.findOne({ slug: storeSlug }).select("_id tenantId").lean();
  const raw = store
    ? await Brand.findOne({ slug: brandSlug, storeId: store._id, tenantId: store.tenantId, isActive: true }).lean()
    : null;
  if (!raw) notFound();

  const brand = serialize(raw) as IBrand;
  const page  = sp.page ? Number(sp.page) : 1;

  const sortOptions = [
    { value: "newest",     label: "Newest"             },
    { value: "popular",    label: "Most Popular"       },
    { value: "price_asc",  label: "Price: Low → High" },
    { value: "price_desc", label: "Price: High → Low" },
  ];

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
        <Link href={base} className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`${base}/brands`} className="hover:text-foreground">Brands</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{brand.name}</span>
      </nav>

      {/* Brand Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center mb-8">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border bg-muted flex items-center justify-center">
          {brand.logo ? (
            <Image src={brand.logo} alt={brand.name} fill className="object-contain p-3" sizes="96px" />
          ) : (
            <span className="text-4xl font-bold text-muted-foreground">{brand.name.charAt(0)}</span>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold">{brand.name}</h1>
            {brand.isFeatured && <Badge>Featured</Badge>}
          </div>
          {brand.description && (
            <p className="text-muted-foreground max-w-2xl">{brand.description}</p>
          )}
          {brand.website && (
            <a href={brand.website} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
              <ExternalLink className="h-3.5 w-3.5" />
              {brand.website.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full lg:w-48 shrink-0 space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Sort By</h3>
            <div className="space-y-1">
              {sortOptions.map((opt) => (
                <Link key={opt.value}
                  href={`${base}/brands/${brandSlug}?sortBy=${opt.value}`}
                  className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                    sp.sortBy === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}>
                  {opt.label}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* Products */}
        <div className="flex-1">
          <Suspense fallback={<ProductGridSkeleton count={12} />}>
            <BrandProducts
              brandId={brand._id.toString()}
              brandSlug={brandSlug}
              sortBy={sp.sortBy}
              page={page}
              storeSlug={storeSlug}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
