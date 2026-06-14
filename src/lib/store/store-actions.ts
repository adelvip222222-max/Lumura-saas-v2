// src/lib/store/store-actions.ts
import { connectToDatabase } from '@/lib/db/mongodb';
import Store from '@/models/Store';
import Tenant from '@/models/Tenant';
import mongoose from 'mongoose';
import { deleteFromCloudinary } from '@/lib/cloudinary';

// تعريف نوع IStore جزئياً
interface IStore {
  _id: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  slug: string;
  name: string;
  nameEn: string;
  description?: string;
  descriptionEn?: string;
  shortBio?: string;
  shortBioEn?: string;
  email: string;
  phone: string;
  address?: string;
  logo?: string;
  logoPublicId?: string;
  coverImage?: string;
  coverPublicId?: string;
  settings: {
    currency: string;
    language: string;
    timezone: string;
    dateFormat: string;
    themePreset?: string;
    productGridStyle?: "classic" | "compact" | "editorial" | "masonry";
    filtersPlacement?: "top" | "sidebar" | "drawer";
    heroStyle?: "split" | "centered" | "editorial";
    iconStyle?: "outline" | "solid" | "duotone";
    fontFamily?: "system" | "cairo" | "tajawal" | "inter";
    cornerRadius?: "sharp" | "soft" | "rounded";
    theme: {
      primaryColor: string;
      secondaryColor: string;
    };
  };
  seo: {
    title?: string;
    titleEn?: string;
    description?: string;
    descriptionEn?: string;
    keywords: string[];
  };
  statistics: {
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    totalCustomers: number;
  };
  isActive: boolean;
  isSuspended: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// جلب متجر بواسطة slug
export async function getStoreBySlug(slug: string, options: { publicOnly?: boolean } = {}) {
  await connectToDatabase();
  const query: Record<string, unknown> = { slug, isDeleted: false };
  if (options.publicOnly) {
    query.isActive = true;
    query.isSuspended = { $ne: true };
  }
  return await Store.findOne(query).lean();
}

// جلب متجر بواسطة ID
export async function getStoreById(id: string) {
  await connectToDatabase();
  return await Store.findById(id).lean();
}

// جلب جميع متاجر مستأجر معين
export async function getStoresByTenant(tenantId: string) {
  await connectToDatabase();
  return await Store.find({ 
    tenantId: new mongoose.Types.ObjectId(tenantId), 
    isDeleted: false 
  }).sort({ createdAt: -1 }).lean();
}

// إنشاء متجر جديد
export async function createStore(data: {
  tenantId: string;
  slug: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  email: string;
  phone: string;
  logo?: string;
  logoPublicId?: string;
  coverImage?: string;
  coverPublicId?: string;
}) {
  await connectToDatabase();
  
  // التحقق من عدد المتاجر المسموح بها للمستأجر
  const tenant = await Tenant.findById(data.tenantId);
  const storesCount = await Store.countDocuments({ tenantId: data.tenantId });
  
  if (storesCount >= (tenant?.maxStores || 1)) {
    throw new Error('You have reached the maximum number of stores allowed in your plan');
  }
  
  // التحقق من وجود slug مكرر
  const existingStore = await Store.findOne({ slug: data.slug });
  if (existingStore) {
    throw new Error('Store slug already exists');
  }
  
  const store = await Store.create({
    ...data,
    tenantId: new mongoose.Types.ObjectId(data.tenantId),
    settings: {
      currency: 'EGP',
      language: 'ar',
      timezone: 'Africa/Cairo',
      dateFormat: 'DD/MM/YYYY',
      themePreset: 'modern',
      productGridStyle: 'classic',
      filtersPlacement: 'top',
      heroStyle: 'split',
      iconStyle: 'duotone',
      fontFamily: 'system',
      cornerRadius: 'soft',
      theme: { primaryColor: '#f97316', secondaryColor: '#10B981' }
    },
    seo: {
      title: data.name,
      titleEn: data.nameEn,
      description: data.description?.slice(0, 160),
      descriptionEn: data.descriptionEn?.slice(0, 160),
      keywords: []
    },
    statistics: {
      totalProducts: 0,
      totalOrders: 0,
      totalRevenue: 0,
      totalCustomers: 0
    },
    isActive: true,
    isDeleted: false,
  });
  
  return store;
}

// تحديث المتجر (معدل بالكامل)
export async function updateStore(
  storeId: string, 
  data: Partial<{
    name: string;
    nameEn: string;
    description: string;
    descriptionEn: string;
    shortBio: string;
    shortBioEn: string;
    email: string;
    phone: string;
    address: string;
    logo: string;
    logoPublicId: string;
    coverImage: string;
    coverPublicId: string;
    favicon: string;
    faviconPublicId: string;
    settings: IStore['settings'];
    seo: IStore['seo'];
    isActive: boolean;
  }>
) {
  await connectToDatabase();
  
  // حذف الصور القديمة من Cloudinary إذا تم تغييرها
  if (data.logoPublicId && data.logo !== undefined) {
    const oldStore = await Store.findById(storeId);
    if (oldStore?.logoPublicId && oldStore.logoPublicId !== data.logoPublicId) {
      await deleteFromCloudinary(oldStore.logoPublicId).catch(console.error);
    }
  }
  
  if (data.coverPublicId && data.coverImage !== undefined) {
    const oldStore = await Store.findById(storeId);
    if (oldStore?.coverPublicId && oldStore.coverPublicId !== data.coverPublicId) {
      await deleteFromCloudinary(oldStore.coverPublicId).catch(console.error);
    }
  }

  if (data.faviconPublicId && data.favicon !== undefined) {
    const oldStore = await Store.findById(storeId);
    if (oldStore?.faviconPublicId && oldStore.faviconPublicId !== data.faviconPublicId) {
      await deleteFromCloudinary(oldStore.faviconPublicId).catch(console.error);
    }
  }
  
  const updatedStore = await Store.findByIdAndUpdate(
    storeId,
    { 
      ...data, 
      updatedAt: new Date() 
    },
    { new: true, runValidators: true }
  ).lean();
  
  return updatedStore;
}

// حذف المتجر (حذف منطقي مع حذف الصور من Cloudinary)
export async function deleteStore(storeId: string) {
  await connectToDatabase();
  
  // جلب بيانات المتجر لحذف صوره من Cloudinary
  const store = await Store.findById(storeId);
  
  if (store) {
    // حذف الشعار من Cloudinary
    if (store.logoPublicId) {
      await deleteFromCloudinary(store.logoPublicId).catch(console.error);
    }
    // حذف صورة الغلاف من Cloudinary
    if (store.coverPublicId) {
      await deleteFromCloudinary(store.coverPublicId).catch(console.error);
    }
    if (store.faviconPublicId) {
      await deleteFromCloudinary(store.faviconPublicId).catch(console.error);
    }
  }
  
  return await Store.findByIdAndUpdate(
    storeId,
    { isDeleted: true, isActive: false, deletedAt: new Date() }
  ).lean();
}

// تحديث إعدادات المتجر
export async function updateStoreSettings(storeId: string, settings: IStore['settings']) {
  await connectToDatabase();
  return await Store.findByIdAndUpdate(
    storeId,
    { settings, updatedAt: new Date() },
    { new: true }
  ).lean();
}

// تحديث SEO المتجر
export async function updateStoreSEO(storeId: string, seo: IStore['seo']) {
  await connectToDatabase();
  return await Store.findByIdAndUpdate(
    storeId,
    { seo, updatedAt: new Date() },
    { new: true }
  ).lean();
}

// تحديث إحصائيات المتجر
export async function updateStoreStatistics(
  storeId: string, 
  statistics: Partial<IStore['statistics']>
) {
  await connectToDatabase();
  return await Store.findByIdAndUpdate(
    storeId,
    { 
      $inc: statistics,  // استخدام $inc للزيادة
      updatedAt: new Date() 
    },
    { new: true }
  ).lean();
}

// تحديث حالة المتجر (تفعيل/تعطيل)
export async function toggleStoreStatus(storeId: string, isActive: boolean) {
  await connectToDatabase();
  return await Store.findByIdAndUpdate(
    storeId,
    { isActive, updatedAt: new Date() },
    { new: true }
  ).lean();
}

// التحقق من وجود slug (للتأكد من عدم التكرار)
export async function isSlugAvailable(slug: string, excludeStoreId?: string): Promise<boolean> {
  await connectToDatabase();
  const query: any = { slug, isDeleted: false };
  if (excludeStoreId) {
    query._id = { $ne: new mongoose.Types.ObjectId(excludeStoreId) };
  }
  const existingStore = await Store.findOne(query);
  return !existingStore;
}