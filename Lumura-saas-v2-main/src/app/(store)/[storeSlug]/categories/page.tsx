import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Package } from "lucide-react";
import { getStoreCategories } from "@/lib/store/store-categories";
import { getStoreProducts } from "@/lib/store/store-products";
import { Badge } from "@/components/ui/badge";
import type { ICategory } from "@/models/Category";

interface Props {
  params: Promise<{ storeSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { storeSlug } = await params;
  return { title: `Categories — ${storeSlug}` };
}

export default async function StoreCategoriesPage({ params }: Props) {
  const { storeSlug } = await params;
  const base = `/${storeSlug}`;

  const categories = (await getStoreCategories(storeSlug)) as ICategory[];

  // Count products per category
  const counts: Record<string, number> = {};
  await Promise.all(
    categories.map(async (cat) => {
      const r = await getStoreProducts(storeSlug, { category: cat._id.toString(), limit: 1, page: 1, isActive: true });
      counts[cat._id.toString()] = r.pagination.total ?? 0;
    })
  );

  const featured = categories.filter((c) => c.isFeatured);
  const rest     = categories.filter((c) => !c.isFeatured);

  return (
    <div className="container py-10 space-y-12">
      {/* Header */}
      <div>
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
          <Link href={base} className="hover:text-foreground">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">Categories</span>
        </nav>
        <h1 className="text-3xl font-bold">All Categories</h1>
        <p className="text-muted-foreground mt-1">Browse products by category</p>
      </div>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="space-y-5">
          <h2 className="text-xl font-semibold">Featured Categories</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((cat) => (
              <Link
                key={cat._id.toString()}
                href={`${base}/categories/${cat.slug}`}
                className="group relative overflow-hidden rounded-2xl border bg-card transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/20">
                  {cat.image ? (
                    <Image src={cat.image} alt={cat.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 640px) 100vw, 33vw" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-6xl">{cat.icon ?? "📦"}</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <Badge className="absolute right-3 top-3 bg-white/90 text-foreground hover:bg-white/90">
                    {counts[cat._id.toString()] ?? 0} products
                  </Badge>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{cat.name}</h3>
                      {cat.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{cat.description}</p>}
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5 transition-transform group-hover:translate-x-1" />
                  </div>
                  {cat.subcategories.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {cat.subcategories.slice(0, 4).map((sub) => (
                        <span key={sub._id.toString()} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                          {sub.name}
                        </span>
                      ))}
                      {cat.subcategories.length > 4 && (
                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                          +{cat.subcategories.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Rest */}
      {rest.length > 0 && (
        <section className="space-y-5">
          <h2 className="text-xl font-semibold">{featured.length > 0 ? "More Categories" : "All Categories"}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {rest.map((cat) => (
              <Link
                key={cat._id.toString()}
                href={`${base}/categories/${cat.slug}`}
                className="group flex flex-col items-center gap-3 rounded-xl border bg-card p-5 text-center transition-all hover:shadow-md hover:border-primary/50 hover:-translate-y-0.5"
              >
                <div className="relative h-14 w-14 overflow-hidden rounded-full bg-muted flex items-center justify-center">
                  {cat.image ? (
                    <Image src={cat.image} alt={cat.name} fill className="object-cover" sizes="56px" />
                  ) : (
                    <span className="text-2xl">{cat.icon ?? "📦"}</span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm group-hover:text-primary transition-colors">{cat.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{counts[cat._id.toString()] ?? 0} products</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {categories.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Package className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-semibold">No categories yet</h2>
        </div>
      )}
    </div>
  );
}
