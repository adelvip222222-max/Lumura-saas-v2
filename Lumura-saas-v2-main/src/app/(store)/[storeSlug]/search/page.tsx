import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { getProductsAction } from "@/actions/products";
import { ProductCard } from "@/components/store/product-card";
import { ProductGridSkeleton } from "@/components/store/product-card-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { IProduct } from "@/models/Product";

interface Props {
  params:      Promise<{ storeSlug: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  return { title: sp.q ? `Search: "${sp.q}"` : "Search" };
}

async function SearchResults({
  query, page, storeSlug,
}: {
  query: string; page: number; storeSlug: string;
}) {
  if (!query.trim()) {
    return (
      <div className="text-center py-16">
        <Search className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground">Enter a search term to find products</p>
      </div>
    );
  }

  const result = await getProductsAction({ storeSlug, search: query, page, limit: 12 });

  if (!result.success || !result.data) {
    return <p className="text-center text-muted-foreground py-12">Search failed. Try again.</p>;
  }

  const { data: products, pagination } = result.data;
  const base = `/${storeSlug}/search`;

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <Search className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
        <p className="font-semibold text-lg">No results for &ldquo;{query}&rdquo;</p>
        <p className="text-muted-foreground text-sm mt-1">Try different keywords</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {pagination.total} results for &ldquo;<strong>{query}</strong>&rdquo;
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p._id.toString()} product={p as unknown as IProduct} storeSlug={storeSlug} />
        ))}
      </div>
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          {pagination.hasPrev && (
            <Button variant="outline" size="sm" >
              <Link href={`${base}?q=${encodeURIComponent(query)}&page=${pagination.page - 1}`}>Previous</Link>
            </Button>
          )}
          <span className="text-sm text-muted-foreground">{pagination.page} / {pagination.totalPages}</span>
          {pagination.hasNext && (
            <Button variant="outline" size="sm" >
              <Link href={`${base}?q=${encodeURIComponent(query)}&page=${pagination.page + 1}`}>Next</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default async function StoreSearchPage({ params, searchParams }: Props) {
  const { storeSlug } = await params;
  const sp    = await searchParams;
  const query = sp.q ?? "";
  const page  = sp.page ? Number(sp.page) : 1;
  const base  = `/${storeSlug}`;

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Search</h1>
        <p className="text-muted-foreground mt-1">Find products in our store</p>
      </div>

      {/* Search form */}
      <form method="GET" action={`${base}/search`} className="flex gap-3 max-w-xl">
        <Input
          name="q"
          defaultValue={query}
          placeholder="Search products..."
          leftIcon={<Search className="h-4 w-4" />}
          autoFocus
        />
        <Button type="submit">Search</Button>
      </form>

      <Suspense fallback={<ProductGridSkeleton count={12} />}>
        <SearchResults query={query} page={page} storeSlug={storeSlug} />
      </Suspense>
    </div>
  );
}
