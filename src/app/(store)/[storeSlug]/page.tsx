import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Package,
  Search,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { ProductCard } from "@/components/store/product-card";
import { StoreHomeHeroSlider } from "@/components/store-front/store-home-hero-slider";
import { getStoreBySlug } from "@/lib/store/store-actions";
import { getStoreCategories } from "@/lib/store/store-categories";
import { getStoreProducts } from "@/lib/store/store-products";
import { getStoreBrands } from "@/lib/store/store-brands";
import { serializeMongoDoc, serializeMongoDocs } from "@/lib/utils/serialize";
import { getStoreMetadata } from "@/lib/store/store-metadata";
import {
  buildStorePublicTheme,
  getStoreDisplayName,
  getStoreShortBio,
  type StorePublicTheme,
} from "@/lib/store/store-theme";
import { cn } from "@/lib/utils";

import "@/models";

interface Props {
  params: Promise<{ storeSlug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { storeSlug } = await params;
  return (await getStoreMetadata(storeSlug)) ?? { title: "متجر غير متاح" };
}

export default async function StoreHomePage({ params }: Props) {
  const { storeSlug } = await params;

  const store = await getStoreBySlug(storeSlug, { publicOnly: true });
  if (!store) notFound();

  const [categories, productsResult, brands, offersResult] = await Promise.all([
    getStoreCategories(storeSlug),
    getStoreProducts(storeSlug, { isActive: true, limit: 16, page: 1 }),
    getStoreBrands(storeSlug),
    getStoreProducts(storeSlug, { isActive: true, onlyOffers: true, limit: 8, page: 1 }),
  ]);

  const plainCategories = serializeMongoDocs(categories);
  const plainBrands = serializeMongoDocs(brands);
  const plainProducts = serializeMongoDocs(productsResult.products ?? []);
  const plainOffers = serializeMongoDocs(offersResult.products ?? []);
  const featuredProducts = plainProducts.filter((p: any) => p.isFeatured).slice(0, 8);
  const newProducts = plainProducts.slice(0, 8);
  const heroProducts = plainProducts.slice(0, 3);

  const theme = buildStorePublicTheme(
    serializeMongoDoc(store) as Parameters<typeof buildStorePublicTheme>[0]
  );
  const isAr = theme.language === "ar";
  const dir = isAr ? "rtl" : "ltr";
  const ArrowIcon = isAr ? ChevronLeft : ChevronRight;
  const storeName = getStoreDisplayName(theme);
  const bio =
    getStoreShortBio(theme) ||
    (isAr
      ? "اكتشف تشكيلة مختارة بعناية من المنتجات الجديدة والعروض المميزة."
      : "Discover a curated selection of new arrivals and featured offers.");

  const firstHeroProductWithImage = heroProducts.find((product: any) => product.images?.[0]?.url) as any;
  const fallbackHeroImage = theme.coverImage || firstHeroProductWithImage?.images?.[0]?.url;

  return (
    <div className="bg-white text-slate-950" dir={dir}>
      <HeroSection
        theme={theme}
        storeSlug={storeSlug}
        storeName={storeName}
        bio={bio}
        fallbackHeroImage={fallbackHeroImage}
        isAr={isAr}
        ArrowIcon={ArrowIcon}
      />

      {plainCategories.length > 0 && (
        <section className="border-y border-slate-100 bg-slate-50/60 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle
              eyebrow={isAr ? "تسوق حسب الفئة" : "Shop by category"}
              title={isAr ? "اختيارات سريعة" : "Quick picks"}
              href={`/${storeSlug}/categories`}
              hrefLabel={isAr ? "كل الفئات" : "All categories"}
            />
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {plainCategories.slice(0, 4).map((category: any, index: number) => (
                <Link
                  key={category._id}
                  href={`/${storeSlug}/categories/${category.slug}`}
                  className="group store-rounded-by-theme relative min-h-44 overflow-hidden bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white" />
                  <div
                    className="absolute -bottom-12 -end-12 h-32 w-32 rounded-full opacity-10 transition group-hover:scale-125"
                    style={{ backgroundColor: index % 2 ? "var(--store-secondary)" : "var(--store-primary)" }}
                  />
                  <div className="relative">
                    <span className="store-feature-icon grid h-12 w-12 place-items-center rounded-full">
                      <Package className="h-5 w-5" />
                    </span>
                    <h3 className="mt-5 text-xl font-black text-slate-950">{category.name}</h3>
                    <p className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-slate-500 group-hover:text-slate-950">
                      {isAr ? "تصفح الآن" : "Browse now"}
                      <ArrowIcon className="h-4 w-4" />
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {plainOffers.length > 0 && (
        <section className="border-b border-red-100 bg-red-50/20 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle
              eyebrow={isAr ? "عروض حصرية" : "Special discounts"}
              title={isAr ? "أقوى العروض والخصومات 🔥" : "Hot Offers & Discounts 🔥"}
              href={`/${storeSlug}/products?offers=true`}
              hrefLabel={isAr ? "كل العروض" : "All offers"}
            />
            <ProductGrid products={plainOffers} storeSlug={storeSlug} theme={theme} />
          </div>
        </section>
      )}

      {newProducts.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle
              eyebrow={isAr ? "وصل حديثًا" : "New arrivals"}
              title={isAr ? "أحدث المنتجات" : "Latest products"}
              href={`/${storeSlug}/products`}
              hrefLabel={isAr ? "عرض الكل" : "View all"}
            />
            <ProductGrid products={newProducts} storeSlug={storeSlug} theme={theme} />
          </div>
        </section>
      )}

      <section className="bg-slate-950 py-14 text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_auto] lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/50">
              {isAr ? "عرض خاص" : "Special offer"}
            </p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              {isAr ? "اكتشف المنتجات المميزة لهذا الأسبوع" : "Discover this week's featured edit"}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              {isAr
                ? "واجهة تسوق بسيطة وسريعة تساعد عملاءك على الوصول للمنتجات والشراء بسهولة."
                : "A clean shopping experience that helps customers find products and buy with less friction."}
            </p>
          </div>
          <Link
            href={`/${storeSlug}/products?featured=true`}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--store-radius)] bg-white px-8 text-sm font-black uppercase tracking-wide text-slate-950"
          >
            {isAr ? "المنتجات المميزة" : "Featured products"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {featuredProducts.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle
              eyebrow={isAr ? "مختاراتنا" : "Our picks"}
              title={isAr ? "منتجات مميزة" : "Featured products"}
              href={`/${storeSlug}/products?featured=true`}
              hrefLabel={isAr ? "عرض الكل" : "View all"}
            />
            <ProductGrid products={featuredProducts} storeSlug={storeSlug} theme={theme} />
          </div>
        </section>
      )}

      {plainBrands.length > 0 && (
        <section className="border-t border-slate-100 bg-slate-50 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle
              eyebrow={isAr ? "الماركات" : "Brands"}
              title={isAr ? "تسوق من الماركات" : "Shop by brand"}
              href={`/${storeSlug}/brands`}
              hrefLabel={isAr ? "كل الماركات" : "All brands"}
            />
            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
              {plainBrands.slice(0, 6).map((brand: any) => (
                <Link
                  key={brand._id}
                  href={`/${storeSlug}/brands/${brand.slug}`}
                  className="store-rounded-by-theme flex h-20 items-center justify-center border border-slate-200 bg-white px-4 text-center text-sm font-black text-slate-700 transition hover:border-slate-950"
                >
                  {brand.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-slate-100 bg-white py-12">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
          {[
            { icon: Truck, title: isAr ? "شحن سريع" : "Fast delivery", desc: isAr ? "تجهيز الطلبات بسرعة" : "Quick order handling" },
            { icon: ShieldCheck, title: isAr ? "دفع آمن" : "Secure checkout", desc: isAr ? "بياناتك محمية" : "Protected customer data" },
            { icon: BadgeCheck, title: isAr ? "منتجات موثوقة" : "Quality products", desc: isAr ? "اختيارات بعناية" : "Carefully selected" },
            { icon: Headphones, title: isAr ? "دعم العملاء" : "Customer support", desc: isAr ? "نحن هنا للمساعدة" : "Here when needed" },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-4">
              <span className="store-feature-icon grid h-12 w-12 place-items-center rounded-full">
                <item.icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-black text-slate-950">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function HeroSection({
  theme,
  storeSlug,
  storeName,
  bio,
  fallbackHeroImage,
  isAr,
  ArrowIcon,
}: {
  theme: StorePublicTheme;
  storeSlug: string;
  storeName: string;
  bio: string;
  fallbackHeroImage?: string;
  isAr: boolean;
  ArrowIcon: typeof ChevronLeft;
}) {
  const centered = theme.heroStyle === "centered";
  const editorial = theme.heroStyle === "editorial";

  return (
    <section
      className={cn(
        "relative overflow-hidden",
        centered && "bg-[var(--store-primary-muted)] text-center",
        editorial && "bg-slate-950 text-white"
      )}
    >
      <div
        className={cn(
          "absolute inset-0 opacity-70",
          centered && "bg-[radial-gradient(circle_at_top,var(--store-secondary-soft),transparent_45%)]",
          editorial && "bg-[radial-gradient(circle_at_top_right,var(--store-primary-soft),transparent_40%)]"
        )}
      />
      <div
        className={cn(
          "relative mx-auto grid min-h-[560px] max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:px-8 lg:py-16",
          centered ? "lg:grid-cols-1" : "lg:grid-cols-[1fr_0.9fr]",
          editorial && "lg:grid-cols-[0.95fr_1.05fr]"
        )}
      >
        <div className={cn("max-w-2xl", centered && "mx-auto", editorial && "lg:order-2")}>
          <p className={cn("mb-4 text-xs font-bold uppercase tracking-[0.32em]", editorial ? "text-white/50" : "text-slate-400")}>
            {isAr ? "مجموعة الموسم" : "Season collection"}
          </p>
          <h1 className={cn("text-4xl font-black leading-tight tracking-normal sm:text-5xl lg:text-6xl", editorial ? "text-white" : "text-slate-950")}>
            {isAr ? "تسوّق أحدث المنتجات بأسلوب يعكس هوية متجرك" : "Shop new arrivals in a storefront that fits your brand"}
          </h1>
          <p className={cn("mt-5 max-w-xl text-base leading-8", centered && "mx-auto", editorial ? "text-slate-300" : "text-slate-600")}>
            {bio}
          </p>

          <div className={cn("mt-8 flex flex-col gap-3 sm:flex-row", centered && "justify-center")}>
            <Link
              href={`/${storeSlug}/products`}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--store-radius)] px-8 text-sm font-bold uppercase tracking-wide text-white transition hover:opacity-90"
              style={{ backgroundColor: "var(--store-primary)" }}
            >
              {isAr ? "تسوق الآن" : "Shop now"}
              <ArrowIcon className="h-4 w-4" />
            </Link>
            <Link
              href={`/${storeSlug}/categories`}
              className={cn(
                "inline-flex h-12 items-center justify-center rounded-[var(--store-radius)] border px-8 text-sm font-bold uppercase tracking-wide transition",
                editorial ? "border-white/25 text-white hover:bg-white/10" : "border-slate-300 text-slate-900 hover:border-slate-950"
              )}
            >
              {isAr ? "استكشف الفئات" : "Explore categories"}
            </Link>
          </div>

          <form action={`/${storeSlug}/search`} className={cn("mt-10 max-w-lg", centered && "mx-auto")}>
            <div className="flex h-14 items-center rounded-[var(--store-radius)] border border-slate-200 bg-white px-4 shadow-sm">
              <Search className="h-5 w-5 shrink-0 text-slate-400" />
              <input
                name="q"
                className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-900 outline-none"
                placeholder={isAr ? "ابحث عن منتج، تصنيف، أو ماركة" : "Search product, category, or brand"}
              />
              <button type="submit" className="text-sm font-bold text-slate-950">
                {isAr ? "بحث" : "Search"}
              </button>
            </div>
          </form>
        </div>

        {!centered && (
          <StoreHomeHeroSlider
            slides={theme.coverImages ?? []}
            fallbackImage={fallbackHeroImage}
            storeName={storeName}
            caption={isAr ? "منتجات مختارة بعناية" : "Curated products"}
            isAr={isAr}
          />
        )}
      </div>
    </section>
  );
}

function SectionTitle({
  eyebrow,
  title,
  href,
  hrefLabel,
}: {
  eyebrow: string;
  title: string;
  href: string;
  hrefLabel: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">{eyebrow}</p>
        <h2 className="mt-2 text-3xl font-black tracking-normal text-slate-950">{title}</h2>
      </div>
      <Link href={href} className="hidden text-sm font-bold text-slate-600 transition hover:text-slate-950 sm:inline-flex">
        {hrefLabel}
      </Link>
    </div>
  );
}

function ProductGrid({ products, storeSlug, theme }: { products: any[]; storeSlug: string; theme: StorePublicTheme }) {
  const gridClass = {
    classic: "grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4",
    compact: "grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5",
    editorial: "grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3",
    masonry: "grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4",
  }[theme.productGridStyle];

  return (
    <div className={cn("mt-8 grid", gridClass)}>
      {products.map((product: any) => (
        <ProductCard key={product._id} product={product} storeSlug={storeSlug} />
      ))}
    </div>
  );
}
