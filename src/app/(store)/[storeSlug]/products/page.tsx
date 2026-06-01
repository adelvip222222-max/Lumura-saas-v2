import Link from "next/link";
import { ArrowLeft, Search, SlidersHorizontal } from "lucide-react";
import { getStoreCategories } from "@/lib/store/store-categories";
import { getStoreProducts } from "@/lib/store/store-products";
import { ProductCard } from "@/components/store/product-card";
import { serializeMongoDocs } from "@/lib/utils/serialize";

interface Props {
  params: Promise<{ storeSlug: string }>;
  searchParams: Promise<{ search?: string; category?: string; page?: string; sortBy?: string }>;
}

export default async function StoreProductsPage({ params, searchParams }: Props) {
  const { storeSlug } = await params;
  const query = await searchParams;
  const page = query.page ? Number(query.page) : 1;
  const search = query.search?.trim() ?? "";

  const [categories, productsResult] = await Promise.all([
    getStoreCategories(storeSlug),
    getStoreProducts(storeSlug, {
      isActive: true,
      search,
      category: query.category,
      page,
      limit: 12,
    }),
  ]);

  const products = serializeMongoDocs(productsResult.products ?? []);
  const pagination = productsResult.pagination;
  const hrefFor = (nextPage: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (query.category) params.set("category", query.category);
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    return qs ? `/${storeSlug}/products?${qs}` : `/${storeSlug}/products`;
  };

  return (
    <div className="min-h-screen bg-[#fff7ee]">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <Link href={`/${storeSlug}`} className="rounded-full bg-white p-3 shadow-sm">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-serif text-2xl font-black">Products</h1>
          <Link href={`/${storeSlug}/search`} className="rounded-full bg-white p-3 shadow-sm">
            <Search className="h-5 w-5" />
          </Link>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          <Link
            href={`/${storeSlug}/products`}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold shadow-sm ${!query.category ? "bg-white" : "border bg-transparent"}`}
          >
            All
          </Link>
          {categories.map((category: any) => (
            <Link
              key={category._id.toString()}
              href={`/${storeSlug}/products?category=${category._id.toString()}`}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold shadow-sm ${
                query.category === category._id.toString() ? "bg-white" : "border bg-transparent"
              }`}
            >
              {category.name}
            </Link>
          ))}
        </div>

        <form className="mb-6 grid gap-3 rounded-[22px] bg-white p-4 shadow-sm md:grid-cols-[1fr_auto_auto]">
          <div className="flex h-11 items-center gap-3 rounded-full border px-4">
            <Search className="h-4 w-4" />
            <input name="search" defaultValue={search} placeholder="Search products" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
          </div>
          {query.category && <input type="hidden" name="category" value={query.category} />}
          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-full border px-5 text-sm font-bold">
            <SlidersHorizontal className="h-4 w-4" />
            Search
          </button>
          <Link href={`/${storeSlug}/products`} className="inline-flex h-11 items-center justify-center rounded-full border px-5 text-sm font-bold">
            Clear
          </Link>
        </form>

        <p className="mb-4 text-sm font-medium text-slate-600">
          Showing {products.length} out of {pagination.total} products
        </p>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product: any) => (
            <ProductCard key={product._id.toString()} product={product} storeSlug={storeSlug} />
          ))}
        </div>

        {products.length === 0 && (
          <div className="rounded-[24px] bg-white p-12 text-center font-semibold text-slate-500">
            No products found.
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href={hrefFor(Math.max(1, page - 1))}
              className={`rounded-full border bg-white px-5 py-2 text-sm font-bold ${page <= 1 ? "pointer-events-none opacity-50" : ""}`}
            >
              Previous
            </Link>
            <span className="text-sm font-semibold text-slate-600">
              {page} / {pagination.pages}
            </span>
            <Link
              href={hrefFor(page + 1)}
              className={`rounded-full border bg-white px-5 py-2 text-sm font-bold ${page >= pagination.pages ? "pointer-events-none opacity-50" : ""}`}
            >
              Next
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
