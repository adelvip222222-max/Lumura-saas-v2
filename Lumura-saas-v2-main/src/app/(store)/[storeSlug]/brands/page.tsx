import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Award } from "lucide-react";
import { getStoreBrands } from "@/lib/store/store-brands";
import { getStoreProducts } from "@/lib/store/store-products";
import { Badge } from "@/components/ui/badge";
import type { IBrand } from "@/models/Brand";

interface Props {
  params: Promise<{ storeSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { storeSlug } = await params;
  return { title: `Brands — ${storeSlug}` };
}

export default async function StoreBrandsPage({ params }: Props) {
  const { storeSlug } = await params;
  const base = `/${storeSlug}`;

  const brands = (await getStoreBrands(storeSlug)) as IBrand[];

  const counts: Record<string, number> = {};
  await Promise.all(
    brands.map(async (b) => {
      const r = await getStoreProducts(storeSlug, { brand: b._id.toString(), limit: 1, page: 1, isActive: true });
      counts[b._id.toString()] = r.pagination.total ?? 0;
    })
  );

  const featured = brands.filter((b) => b.isFeatured);
  const rest     = brands.filter((b) => !b.isFeatured);

  return (
    <div className="container py-10 space-y-12">
      <div>
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
          <Link href={base} className="hover:text-foreground">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">Brands</span>
        </nav>
        <h1 className="text-3xl font-bold">All Brands</h1>
        <p className="text-muted-foreground mt-1">Discover products from top brands</p>
      </div>

      {featured.length > 0 && (
        <section className="space-y-5">
          <h2 className="text-xl font-semibold">Featured Brands</h2>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((brand) => (
              <Link key={brand._id.toString()} href={`${base}/brands/${brand.slug}`}
                className="group flex flex-col items-center gap-4 rounded-2xl border bg-card p-6 text-center transition-all hover:shadow-lg hover:border-primary/50 hover:-translate-y-0.5">
                <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-muted flex items-center justify-center">
                  {brand.logo ? (
                    <Image src={brand.logo} alt={brand.name} fill className="object-contain p-2" sizes="80px" />
                  ) : (
                    <span className="text-3xl font-bold text-muted-foreground">{brand.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold group-hover:text-primary transition-colors">{brand.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{counts[brand._id.toString()] ?? 0} products</p>
                </div>
                <Badge variant="outline" className="text-xs">Featured</Badge>
              </Link>
            ))}
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section className="space-y-5">
          <h2 className="text-xl font-semibold">{featured.length > 0 ? "More Brands" : "All Brands"}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {rest.map((brand) => (
              <Link key={brand._id.toString()} href={`${base}/brands/${brand.slug}`}
                className="group flex flex-col items-center gap-3 rounded-xl border bg-card p-4 text-center transition-all hover:shadow-md hover:border-primary/50">
                <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                  {brand.logo ? (
                    <Image src={brand.logo} alt={brand.name} fill className="object-contain p-1" sizes="48px" />
                  ) : (
                    <span className="text-xl font-bold text-muted-foreground">{brand.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium group-hover:text-primary transition-colors">{brand.name}</p>
                  <p className="text-xs text-muted-foreground">{counts[brand._id.toString()] ?? 0}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {brands.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Award className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-semibold">No brands yet</h2>
        </div>
      )}
    </div>
  );
}
