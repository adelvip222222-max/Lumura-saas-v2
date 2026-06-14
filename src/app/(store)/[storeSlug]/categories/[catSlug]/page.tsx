import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronRight } from "lucide-react";
import { getStoreCategoryBySlug } from "@/lib/store/store-categories";
import { getStoreProducts } from "@/lib/store/store-products";
import { ProductCard } from "@/components/store/product-card";
import { ProductGridSkeleton } from "@/components/store/product-card-skeleton";
import { Button } from "@/components/ui/button";
import type { ICategory } from "@/models/Category";
import type { IProduct } from "@/models/Product";

interface Props {
  params:      Promise<{ storeSlug: string; catSlug: string }>;
  searchParams: Promise<{ subcategory?: string; sortBy?: string; page?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { storeSlug, catSlug } = await params;
  const cat = (await getStoreCategoryBySlug(storeSlug, catSlug)) as ICategory | null;
  if (!cat) return { title: "Category" };
  return { title: cat.metaTitle ?? cat.name, description: cat.metaDescription ?? cat.description };
}

async function CategoryProducts({
  categoryId, categorySlug, subcategoryId, sortBy, page, storeSlug,
}: {
  categoryId: string; categorySlug: string; subcategoryId?: string; sortBy?: string; page: number; storeSlug: string;
}) {
  const result = await getStoreProducts(storeSlug, {
    category:   categoryId,
    subcategory: subcategoryId,
    page,
    limit:      12,
    isActive: true,
  });

  const { products, pagination } = result;
  const base = `/${storeSlug}/categories/${categorySlug}`;

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-3">📦</p>
        <p className="font-semibold">No products in this category</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">Showing {products.length} of {pagination.total} products</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p._id.toString()} product={p as unknown as IProduct} storeSlug={storeSlug} />
        ))}
      </div>
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          {pagination.page > 1 && (
            <Button>
              <Link href={`${base}?page=${pagination.page - 1}${subcategoryId ? `&subcategory=${subcategoryId}` : ""}${sortBy ? `&sortBy=${sortBy}` : ""}`}>Previous</Link>
            </Button>
          )}
          <span className="text-sm text-muted-foreground">{pagination.page} / {pagination.pages}</span>
          {pagination.page < pagination.pages && (
            <Button>
              <Link href={`${base}?page=${pagination.page + 1}${subcategoryId ? `&subcategory=${subcategoryId}` : ""}${sortBy ? `&sortBy=${sortBy}` : ""}`}>Next</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default async function StoreCategoryPage({ params, searchParams }: Props) {
  const { storeSlug, catSlug } = await params;
  const sp = await searchParams;
  const base = `/${storeSlug}`;

  const category = (await getStoreCategoryBySlug(storeSlug, catSlug)) as ICategory | null;
  if (!category) notFound();

  const sortOptions = [
    { value: "newest",     label: "Newest"             },
    { value: "popular",    label: "Most Popular"       },
    { value: "price_asc",  label: "Price: Low → High" },
    { value: "price_desc", label: "Price: High → Low" },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
        <Link href={base} className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`${base}/categories`} className="hover:text-foreground">Categories</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{category.name}</span>
      </nav>

      <div className="flex items-start gap-4 mb-8">
        {category.icon && <span className="text-4xl">{category.icon}</span>}
        <div>
          <h1 className="text-3xl font-bold">{category.name}</h1>
          {category.description && <p className="text-muted-foreground mt-1 max-w-2xl">{category.description}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full lg:w-52 shrink-0 space-y-5">
          {category.subcategories.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Subcategories</h3>
              <div className="space-y-1">
                <Link href={`${base}/categories/${catSlug}`}
                  className={`block rounded-lg px-3 py-2 text-sm transition-colors ${!sp.subcategory ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}>
                  All
                </Link>
                {category.subcategories.filter((s) => s.isActive).map((sub) => (
                  <Link key={sub._id.toString()}
                    href={`${base}/categories/${catSlug}?subcategory=${sub._id}`}
                    className={`block rounded-lg px-3 py-2 text-sm transition-colors ${sp.subcategory === sub._id.toString() ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}>
                    {sub.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Sort By</h3>
            <div className="space-y-1">
              {sortOptions.map((opt) => (
                <Link key={opt.value}
                  href={`${base}/categories/${catSlug}?sortBy=${opt.value}${sp.subcategory ? `&subcategory=${sp.subcategory}` : ""}`}
                  className={`block rounded-lg px-3 py-2 text-sm transition-colors ${sp.sortBy === opt.value ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}>
                  {opt.label}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* Products */}
        <div className="flex-1">
          <Suspense fallback={<ProductGridSkeleton count={12} />}>
            <CategoryProducts
              categoryId={category._id.toString()}
              categorySlug={catSlug}
              subcategoryId={sp.subcategory}
              sortBy={sp.sortBy}
              page={sp.page ? Number(sp.page) : 1}
              storeSlug={storeSlug}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
