import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Filter, Search, SlidersHorizontal } from "lucide-react";
import { getStoreCategories } from "@/lib/store/store-categories";
import { getStoreProducts } from "@/lib/store/store-products";
import { getStoreBrands } from "@/lib/store/store-brands";
import { getStoreBySlug } from "@/lib/store/store-actions";
import { buildStorePublicTheme, type StorePublicTheme } from "@/lib/store/store-theme";
import { ProductCard } from "@/components/store/product-card";
import { serializeMongoDoc, serializeMongoDocs } from "@/lib/utils/serialize";
import { cn } from "@/lib/utils";

interface Props {
  params: Promise<{ storeSlug: string }>;
  searchParams: Promise<{
    search?: string;
    category?: string;
    brand?: string;
    offers?: string;
    page?: string;
    sortBy?: string;
  }>;
}

export default async function StoreProductsPage({ params, searchParams }: Props) {
  const { storeSlug } = await params;
  const query = await searchParams;
  const page = query.page ? Number(query.page) : 1;
  const search = query.search?.trim() ?? "";
  const sortBy = query.sortBy ?? "newest";
  const brand = query.brand ?? "";
  const onlyOffers = query.offers === "true";

  const [store, categories, brands, productsResult] = await Promise.all([
    getStoreBySlug(storeSlug, { publicOnly: true }),
    getStoreCategories(storeSlug),
    getStoreBrands(storeSlug),
    getStoreProducts(storeSlug, {
      isActive: true,
      search,
      category: query.category,
      brand: query.brand,
      onlyOffers,
      sortBy,
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
  const plainBrands = serializeMongoDocs(brands);
  const pagination = productsResult.pagination;

  const hrefFor = (nextPage: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (query.category) params.set("category", query.category);
    if (query.brand) params.set("brand", query.brand);
    if (query.offers) params.set("offers", query.offers);
    if (query.sortBy) params.set("sortBy", query.sortBy);
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
        <div className="store-rounded-by-theme bg-white p-12 text-center font-semibold text-slate-500 border border-slate-100 shadow-sm">
          {isAr ? "لا توجد منتجات مطابقة للبحث أو التصفية الحالية." : "No products match your search or filter selection."}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href={hrefFor(Math.max(1, page - 1))}
            className={`rounded-full border bg-white px-5 py-2 text-sm font-bold shadow-sm transition hover:bg-slate-50 ${page <= 1 ? "pointer-events-none opacity-50" : ""}`}
          >
            {isAr ? "السابق" : "Previous"}
          </Link>
          <span className="text-sm font-semibold text-slate-600">
            {page} / {pagination.pages}
          </span>
          <Link
            href={hrefFor(page + 1)}
            className={`rounded-full border bg-white px-5 py-2 text-sm font-bold shadow-sm transition hover:bg-slate-50 ${page >= pagination.pages ? "pointer-events-none opacity-50" : ""}`}
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
          <Link href={`/${storeSlug}`} className="rounded-full bg-white p-3 shadow-sm hover:bg-slate-50 transition border border-slate-100">
            {isAr ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
          </Link>
          <h1 className="text-2xl font-black">{isAr ? "المنتجات" : "Products"}</h1>
          <Link href={`/${storeSlug}/search`} className="rounded-full bg-white p-3 shadow-sm hover:bg-slate-50 transition border border-slate-100">
            <Search className="h-5 w-5" />
          </Link>
        </div>

        {filtersPlacement === "sidebar" ? (
          <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
            <aside className="h-fit lg:sticky lg:top-28">
              <FiltersPanel
                storeSlug={storeSlug}
                query={query}
                search={search}
                categories={plainCategories}
                brands={plainBrands}
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
              brands={plainBrands}
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
  brands,
  isAr,
  mode,
}: {
  storeSlug: string;
  query: { category?: string; brand?: string; offers?: string; sortBy?: string };
  search: string;
  categories: any[];
  brands: any[];
  isAr: boolean;
  mode: "top" | "sidebar" | "drawer";
}) {
  const isSidebar = mode === "sidebar";

  return (
    <div className={cn("mb-6 space-y-5", isSidebar && "store-rounded-by-theme border bg-white p-5 shadow-sm")}>
      <div className="flex items-center justify-between border-b pb-3 border-slate-100">
        <div className="flex items-center gap-2 text-sm font-black text-slate-800">
          <SlidersHorizontal className="h-4 w-4 text-[var(--store-primary,#000)]" />
          <span>{isAr ? "أدوات التصفية والبحث" : "Search & Filters"}</span>
        </div>
        <Link 
          href={`/${storeSlug}/products`} 
          className="text-xs font-bold text-slate-400 hover:text-red-500 transition"
        >
          {isAr ? "إعادة تعيين" : "Reset all"}
        </Link>
      </div>

      <form className="space-y-4">
        {/* Search Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500">{isAr ? "البحث بالاسم" : "Search by name"}</label>
          <div className="flex h-11 items-center gap-3 rounded-full border bg-slate-50 px-4 focus-within:border-[var(--store-primary)] focus-within:bg-white transition">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              name="search"
              defaultValue={search}
              placeholder={isAr ? "اكتب كلمة البحث..." : "Type keywords..."}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none text-slate-800"
            />
          </div>
        </div>

        {/* Hidden inputs to preserve filters on form submit */}
        {query.category && <input type="hidden" name="category" value={query.category} />}
        {query.brand && <input type="hidden" name="brand" value={query.brand} />}
        {query.offers && <input type="hidden" name="offers" value={query.offers} />}

        {/* Sorting Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500">{isAr ? "الترتيب حسب" : "Sort by"}</label>
          <select
            name="sortBy"
            defaultValue={query.sortBy || "newest"}
            className="w-full h-11 rounded-full border bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none focus:border-[var(--store-primary)] focus:bg-white transition cursor-pointer"
          >
            <option value="newest">{isAr ? "الأحدث" : "Newest"}</option>
            <option value="price-asc">{isAr ? "السعر: من الأقل للأعلى" : "Price: Low to High"}</option>
            <option value="price-desc">{isAr ? "السعر: من الأعلى للأقل" : "Price: High to Low"}</option>
            <option value="popular">{isAr ? "الأكثر مبيعاً" : "Most Popular"}</option>
          </select>
        </div>

        <button className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-full bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition">
          {isAr ? "تطبيق البحث" : "Apply Search"}
        </button>
      </form>

      {/* Offers Filter Button */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-500">{isAr ? "العروض والخصومات" : "Offers & Discounts"}</label>
        <div>
          <Link
            href={
              query.offers === "true"
                ? `/${storeSlug}/products`
                : `/${storeSlug}/products?offers=true`
            }
            className={cn(
              "flex items-center gap-3 w-full rounded-2xl p-3 text-sm font-bold border transition",
              query.offers === "true"
                ? "bg-red-50/50 border-red-200 text-red-600"
                : "bg-slate-50/50 border-slate-100 text-slate-700 hover:border-slate-300"
            )}
          >
            <span className={cn(
              "h-4 w-4 shrink-0 rounded border flex items-center justify-center text-xs font-black",
              query.offers === "true" ? "border-red-500 bg-red-500 text-white" : "border-slate-300 bg-white"
            )}>
              {query.offers === "true" && "✓"}
            </span>
            <span>{isAr ? "🔥 عروض وخصومات حصرية" : "🔥 Special Discounts Only"}</span>
          </Link>
        </div>
      </div>

      {/* Categories Filter */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-500">{isAr ? "الأقسام" : "Categories"}</label>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/${storeSlug}/products`}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-bold border transition shadow-sm",
              !query.category
                ? "bg-[var(--store-primary,#000)] text-white border-[var(--store-primary,#000)]"
                : "bg-white text-slate-700 hover:border-slate-300 border-slate-200"
            )}
          >
            {isAr ? "الكل" : "All"}
          </Link>
          {categories.map((category: any) => (
            <Link
              key={category._id.toString()}
              href={`/${storeSlug}/products?category=${category._id.toString()}`}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-bold border transition shadow-sm",
                query.category === category._id.toString()
                  ? "bg-[var(--store-primary,#000)] text-white border-[var(--store-primary,#000)]"
                  : "bg-white text-slate-700 hover:border-slate-300 border-slate-200"
              )}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Brands Filter */}
      {brands.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500">{isAr ? "الماركات" : "Brands"}</label>
          <div className="flex flex-wrap gap-2">
            {brands.map((brand: any) => (
              <Link
                key={brand._id.toString()}
                href={`/${storeSlug}/products?brand=${brand._id.toString()}`}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-bold border transition shadow-sm",
                  query.brand === brand._id.toString()
                    ? "bg-[var(--store-primary,#000)] text-white border-[var(--store-primary,#000)]"
                    : "bg-white text-slate-700 hover:border-slate-300 border-slate-200"
                )}
              >
                {brand.name}
              </Link>
            ))}
          </div>
        </div>
      )}
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
