// src/components/store/HeroSection.tsx
import Link from "next/link";

interface HeroSectionProps {
  store: {
    name: string;
    coverImage?: string;
    description?: string;
    slug: string;
  };
}

export default function HeroSection({ store }: HeroSectionProps) {
  return (
    <section className="relative bg-gradient-to-r from-orange-500 to-orange-600 text-white py-20 rounded-2xl overflow-hidden">
      <div className="absolute inset-0 bg-black/20" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            مرحباً بك في {store.name}
          </h1>
          <p className="text-lg mb-8 opacity-90">
            {store.description || "أفضل المنتجات بأفضل الأسعار - تسوق الآن واستمتع بعروض حصرية"}
          </p>
          <Link
            href={`/${store.slug}/products`}
            className="inline-block bg-white text-orange-600 font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition"
          >
            تسوق الآن
          </Link>
        </div>
      </div>
    </section>
  );
}
