import Brand from "@/models/Brand";
import Category from "@/models/Category";
import { getBusinessCatalogPreset } from "@/config/business-catalog-presets";

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function seedDefaultCatalogForStore({
  tenantId,
  storeId,
  businessCategory,
}: {
  tenantId: unknown;
  storeId: unknown;
  businessCategory?: string;
}) {
  const preset = getBusinessCatalogPreset(businessCategory);

  const categoryOps = preset.categories.slice(0, 15).map((category, index) => ({
    updateOne: {
      filter: { tenantId, storeId, slug: category.slug },
      update: {
        $setOnInsert: {
          tenantId,
          storeId,
          name: category.name,
          nameAr: category.nameAr,
          slug: category.slug,
          icon: category.icon,
          description: category.description,
          descriptionAr: category.descriptionAr,
          subcategories: category.subcategories.map((subcategory, subIndex) => ({
            name: subcategory.name,
            nameAr: subcategory.nameAr,
            slug: subcategory.slug || normalizeSlug(subcategory.name),
            isActive: true,
            sortOrder: subIndex,
          })),
          isActive: true,
          isFeatured: index < 6,
          sortOrder: index,
          metaTitle: category.name,
          metaDescription: category.description,
        },
      },
      upsert: true,
    },
  }));

  const brandOps = preset.brands.slice(0, 15).map((brand, index) => ({
    updateOne: {
      filter: { tenantId, storeId, slug: brand.slug },
      update: {
        $setOnInsert: {
          tenantId,
          storeId,
          name: brand.name,
          nameAr: brand.nameAr ?? brand.name,
          slug: brand.slug || normalizeSlug(brand.name),
          isActive: true,
          isFeatured: index < 8,
          sortOrder: index,
          metaTitle: brand.name,
          metaDescription: `${brand.name} products`,
        },
      },
      upsert: true,
    },
  }));

  const [categoriesResult, brandsResult] = await Promise.all([
    categoryOps.length ? Category.bulkWrite(categoryOps, { ordered: false }) : null,
    brandOps.length ? Brand.bulkWrite(brandOps, { ordered: false }) : null,
  ]);

  return {
    presetId: preset.id,
    categoriesInserted: categoriesResult?.upsertedCount ?? 0,
    brandsInserted: brandsResult?.upsertedCount ?? 0,
  };
}
