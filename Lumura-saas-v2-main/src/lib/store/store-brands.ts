// src/lib/store/store-brands.ts
import { connectToDatabase } from '@/lib/db/mongodb';
import Brand from '@/models/Brand';
import Store from '@/models/Store';
import { serializeMongoDocs } from '@/lib/utils/serialize';

// جلب جميع ماركات المتجر
export async function getStoreBrands(storeSlug: string) {
  await connectToDatabase();
  
  const store = await Store.findOne({ slug: storeSlug });
  if (!store) throw new Error('Store not found');
  
  const brands = await Brand.find({
    storeId: store._id,
    tenantId: store.tenantId,
    isActive: true
  })
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  return serializeMongoDocs(brands);
}

// إنشاء ماركة جديدة
export async function createStoreBrand(storeSlug: string, data: any) {
  await connectToDatabase();
  
  const store = await Store.findOne({ slug: storeSlug });
  if (!store) throw new Error('Store not found');
  
  const slug = data.slug || data.name.toLowerCase().replace(/ /g, '-');
  
  return await Brand.create({
    ...data,
    slug,
    tenantId: store.tenantId,
    storeId: store._id
  });
}

// تحديث ماركة
export async function updateStoreBrand(
  storeSlug: string,
  brandId: string,
  data: any
) {
  await connectToDatabase();
  
  const store = await Store.findOne({ slug: storeSlug });
  if (!store) throw new Error('Store not found');
  
  return await Brand.findOneAndUpdate(
    { _id: brandId, storeId: store._id },
    { ...data, updatedAt: new Date() },
    { new: true }
  ).lean();
}

// حذف ماركة
export async function deleteStoreBrand(storeSlug: string, brandId: string) {
  await connectToDatabase();
  
  const store = await Store.findOne({ slug: storeSlug });
  if (!store) throw new Error('Store not found');
  
  return await Brand.findOneAndDelete({ _id: brandId, storeId: store._id });
}
