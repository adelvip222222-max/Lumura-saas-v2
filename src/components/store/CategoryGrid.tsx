// src/components/store/CategoryGrid.tsx
import Link from "next/link";

interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
}

interface CategoryGridProps {
  categories: Category[];
  storeSlug: string;
}

export default function CategoryGrid({ categories, storeSlug }: CategoryGridProps) {
  if (categories.length === 0) return null;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">الفئات</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((category) => (
          <Link
            key={category._id}
            href={`/${storeSlug}/categories/${category.slug}`}
            className="group text-center"
          >
            <div className="aspect-square rounded-full bg-gray-100 flex items-center justify-center overflow-hidden mb-3 group-hover:bg-orange-100 transition">
              {category.image ? (
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">
                  📁
                </div>
              )}
            </div>
            <h3 className="font-medium text-gray-800 group-hover:text-orange-500 transition">
              {category.name}
            </h3>
          </Link>
        ))}
      </div>
    </div>
  );
}
