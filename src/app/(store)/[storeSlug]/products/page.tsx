import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Filter, Search, SlidersHorizontal } from "lucide-react";
import { getStoreCategories } from "@/lib/store/store-categories";
import { getStoreProducts } from "@/lib/store/store-products";
import { getStoreBySlug } from "@/lib/store/store-actions";
import { buildStorePublicTheme, type StorePublicTheme } from "@/lib/store/store-theme";
import { ProductCard } from "@/components/store/product-card";
import { serializeMongoDoc, serializeMongoDocs } from "@/lib/utils/serialize";
import { cn } from "@/lib/utils";

interface Props {
  params: Promise<{ storeSlug: string }>;
  searchParams: Promise<{ search?: string; category?: string; page?: string; sortBy?: string }>;
}

export default async function StoreProductsPage({ params, searchParams }: Props) {
  const { storeSlug } = await params;
  const query = await searchParams;
  const page = query.page ? Number(query.page) : 1;
  const search = query.search?.trim() ?? "";

  const [store, categories, productsResult] = await Promise.all([
    getStoreBySlug(storeSlug, { publicOnly: true }),
    getStoreCategories(storeSlug),
    getStoreProducts(storeSlug, {
      isActive: true,
      search,
      category: query.category,
      page,
      limit: 12,
    }),
  ]);

  if (!store) notFound();

  const theme = buildStorePublicTheme(serializeMongoDoc(store) as Parameters<typeof buildStorePublicTheme>[0]);
  const isAr = theme.language !== "en";
  const filtersPlacement = theme.filtersPlacement;
  const products = serializeMongoDocs(productsResult.products ?? []);
  const plainCategories = serializeMongoDocs(categories);
  const pagination = productsResult.pagination;
  const hrefFor = (nextPage: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (query.category) params.set("category", query.category);
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    return qs ? `/${storeSlug}/products?${qs}` : `/${storeSlug}/products`;
  };

  const productGridClass = getProductsGridClass(theme);
  const content = (
    <>
      <p className="mb-4 text-sm font-medium text-slate-600">
        {isAr
          ? `عرض ${products.length.toLocaleString("ar-EG")} من ${pagination.total.toLocaleString("ar-EG")} منتج`
          : `Showing ${products.length} out of ${pagination.total} products`}
      </p>

      <div className={cn("grid", productGridClass)}>
        {products.map((product: any) => (
          <ProductCard key={product._id.toString()} product={product} storeSlug={storeSlug} />
        ))}
      </div>

      {products.length === 0 && (
        <div className="store-rounded-by-theme bg-white p-12 text-center font-semibold text-slate-500">
          {isAr ? "لا توجد منتجات مطابقة." : "No products found."}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href={hrefFor(Math.max(1, page - 1))}
            className={`rounded-full border bg-white px-5 py-2 text-sm font-bold ${page <= 1 ? "pointer-events-none opacity-50" : ""}`}
          >
            {isAr ? "السابق" : "Previous"}
          </Link>
          <span className="text-sm font-semibold text-slate-600">
            {page} / {pagination.pages}
          </span>
          <Link
            href={hrefFor(page + 1)}
            className={`rounded-full border bg-white px-5 py-2 text-sm font-bold ${page >= pagination.pages ? "pointer-events-none opacity-50" : ""}`}
          >
            {isAr ? "التالي" : "Next"}
          </Link>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-[var(--store-bg)]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <Link href={`/${storeSlug}`} className="rounded-full bg-white p-3 shadow-sm">
            {isAr ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
          </Link>
          <h1 className="text-2xl font-black">{isAr ? "المنتجات" : "Products"}</h1>
          <Link href={`/${storeSlug}/search`} className="rounded-full bg-white p-3 shadow-sm">
            <Search className="h-5 w-5" />
          </Link>
        </div>

        {filtersPlacement === "sidebar" ? (
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <aside className="h-fit lg:sticky lg:top-28">
              <FiltersPanel
                storeSlug={storeSlug}
                query={query}
                search={search}
                categories={plainCategories}
                isAr={isAr}
                mode="sidebar"
              />
            </aside>
            <section>{content}</section>
          </div>
        ) : (
          <>
            <FiltersPanel
              storeSlug={storeSlug}
              query={query}
              search={search}
              categories={plainCategories}
              isAr={isAr}
              mode={filtersPlacement === "drawer" ? "drawer" : "top"}
            />
            {content}
          </>
        )}
      </div>
    </div>
  );
}

function FiltersPanel({
  storeSlug,
  query,
  search,
  categories,
  isAr,
  mode,
}: {
  storeSlug: string;
  query: { category?: string };
  search: string;
  categories: any[];
  isAr: boolean;
  mode: "top" | "sidebar" | "drawer";
}) {
  const isSidebar = mode === "sidebar";
  const isDrawer = mode === "drawer";

  return (
    <div className={cn("mb-6 space-y-4", isSidebar && "store-rounded-by-theme border bg-white p-4 shadow-sm", isDrawer && "store-rounded-by-theme border bg-white p-4 shadow-sm")}>
      <div className="flex items-center gap-2 text-sm font-black text-slate-700">
        {isDrawer ? <Filter className="h-4 w-4 text-[var(--store-primary)]" /> : <SlidersHorizontal className="h-4 w-4 text-[var(--store-primary)]" />}
        {isAr ? "تصفية وبحث" : "Filters & search"}
      </div>

      <form className={cn("grid gap-3", isSidebar ? "grid-cols-1" : "md:grid-cols-[1fr_auto_auto]")}> 
        <div className="flex h-11 items-center gap-3 rounded-full border bg-white px-4">
          <Search className="h-4 w-4" />
          <input
            name="search"
            defaultValue={search}
            placeholder={isAr ? "ابحث في المنتجات" : "Search products"}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        {query.category && <input type="hidden" name="category" value={query.category} />}
        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-full border px-5 text-sm font-bold hover:border-[var(--store-primary)]">
          <SlidersHorizontal className="h-4 w-4" />
          {isAr ? "بحث" : "Search"}
        </button>
        <Link href={`/${storeSlug}/products`} className="inline-flex h-11 items-center justify-center rounded-full border px-5 text-sm font-bold hover:border-[var(--store-primary)]">
          {isAr ? "مسح" : "Clear"}
        </Link>
      </form>

      <div className={cn("flex gap-2 overflow-x-auto pb-1", isSidebar && "flex-col overflow-visible pb-0")}>
        <Link
          href={`/${storeSlug}/products`}
          className={cn(
            "whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold shadow-sm transition",
            !query.category ? "bg-[var(--store-primary)] text-white" : "border bg-white hover:border-[var(--store-primary)]"
          )}
        >
          {isAr ? "الكل" : "All"}
        </Link>
        {categories.map((category: any) => (
          <Link
            key={category._id.toString()}
            href={`/${storeSlug}/products?category=${category._id.toString()}`}
            className={cn(
              "whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold shadow-sm transition",
              query.category === category._id.toString()
                ? "bg-[var(--store-primary)] text-white"
                : "border bg-white hover:border-[var(--store-primary)]"
            )}
          >
            {category.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

function getProductsGridClass(theme?: StorePublicTheme) {
  switch (theme?.productGridStyle) {
    case "compact":
      return "grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5";
    case "editorial":
      return "grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3";
    case "masonry":
      return "grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4";
    default:
      return "grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4";
  }
}
