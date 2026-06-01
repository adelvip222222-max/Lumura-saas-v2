// src/lib/store/store-categories.ts
import { connectToDatabase } from '@/lib/db/mongodb';
import Category from '@/models/Category';
import Store from '@/models/Store';
import mongoose from 'mongoose';
import { serializeMongoDoc, serializeMongoDocs } from '@/lib/utils/serialize';

// جلب جميع فئات المتجر
export async function getStoreCategories(storeSlug: string) {
  await connectToDatabase();
  
  const store = await Store.findOne({ slug: storeSlug });
  if (!store) throw new Error('Store not found');
  
  const categories = await Category.find({
    storeId: store._id,
    tenantId: store.tenantId,
    isActive: true
  })
    .sort({ sortOrder: 1, createdAt: -1 })
    .lean();

  return serializeMongoDocs(categories);
}

// جلب فئة بواسطة slug
export async function getStoreCategoryBySlug(storeSlug: string, categorySlug: string) {
  await connectToDatabase();
  
  const store = await Store.findOne({ slug: storeSlug });
  if (!store) throw new Error('Store not found');
  
  const category = await Category.findOne({
    slug: categorySlug,
    storeId: store._id,
    tenantId: store.tenantId
  }).lean();

  return category ? serializeMongoDoc(category) : null;
}

// إنشاء فئة جديدة
export async function createStoreCategory(storeSlug: string, data: any) {
  await connectToDatabase();
  
  const store = await Store.findOne({ slug: storeSlug });
  if (!store) throw new Error('Store not found');
  
  // إنشاء slug فريد
  const slug = data.slug || data.name.toLowerCase().replace(/ /g, '-');
  
  const category = await Category.create({
    ...data,
    slug,
    tenantId: store.tenantId,
    storeId: store._id
  });
  
  return category;
}

// تحديث فئة
export async function updateStoreCategory(
  storeSlug: string,
  categoryId: string,
  data: any
) {
  await connectToDatabase();
  
  const store = await Store.findOne({ slug: storeSlug });
  if (!store) throw new Error('Store not found');
  
  return await Category.findOneAndUpdate(
    { _id: categoryId, storeId: store._id },
    { ...data, updatedAt: new Date() },
    { new: true }
  ).lean();
}

// حذف فئة
export async function deleteStoreCategory(storeSlug: string, categoryId: string) {
  await connectToDatabase();
  
  const store = await Store.findOne({ slug: storeSlug });
  if (!store) throw new Error('Store not found');
  
  return await Category.findOneAndDelete({ _id: categoryId, storeId: store._id });
}
