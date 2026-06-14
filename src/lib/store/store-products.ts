// src/lib/store/store-products.ts
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/models/Product';
import Store from '@/models/Store';
import Tenant from '@/models/Tenant';
import { serializeMongoDocs, serializeMongoDoc } from '@/lib/utils/serialize';
import mongoose from 'mongoose';

// جلب منتجات المتجر
export async function getStoreProducts(
  storeSlug: string,
  filters?: {
    category?: string;
    brand?: string;
    subcategory?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    onlyOffers?: boolean;
  }
) {
  await connectToDatabase();
  
  const store = await Store.findOne({ slug: storeSlug });
  if (!store) throw new Error('Store not found');
  
  const query: any = { 
    storeId: store._id, 
    tenantId: store.tenantId,
    isDeleted: false 
  };
  
  if (filters?.category) {
    query.category = new mongoose.Types.ObjectId(filters.category);
  }

  if (filters?.brand) {
    query.brand = new mongoose.Types.ObjectId(filters.brand);
  }

  if (filters?.onlyOffers) {
    query.discountPrice = { $exists: true, $gt: 0 };
  }

  if (filters?.subcategory) {
    query.subcategoryId = filters.subcategory;
  }
  
  if (filters?.isActive !== undefined) {
    query.isActive = filters.isActive;
  }
  
  if (filters?.search?.trim()) {
    const escapedSearch = filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escapedSearch, 'i');

    query.$or = [
      { name: searchRegex },
      { nameAr: searchRegex },
      { description: searchRegex },
      { descriptionAr: searchRegex },
      { sku: searchRegex },
      { barcode: searchRegex },
      { tags: searchRegex },
    ];
  }
  
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const skip = (page - 1) * limit;

  let sortOption: any = { createdAt: -1 };
  if (filters?.sortBy) {
    if (filters.sortBy === 'price-asc') {
      sortOption = { sellingPrice: 1 };
    } else if (filters.sortBy === 'price-desc') {
      sortOption = { sellingPrice: -1 };
    } else if (filters.sortBy === 'oldest') {
      sortOption = { createdAt: 1 };
    } else if (filters.sortBy === 'popular') {
      sortOption = { soldQuantity: -1 };
    }
  }
  
  const [products, total] = await Promise.all([
    Product.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate('category', 'name slug')
      .populate('brand', 'name logo')
      .lean(),
    Product.countDocuments(query)
  ]);
  
  return {
    products: serializeMongoDocs(products),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      totalPages: Math.ceil(total / limit),
    },
  };
}

// جلب منتج بواسطة slug
export async function getStoreProductBySlug(storeSlug: string, productSlug: string) {
  await connectToDatabase();
  
  const store = await Store.findOne({ slug: storeSlug });
  if (!store) throw new Error('Store not found');
  
  const product = await Product.findOne({
    slug: productSlug,
    storeId: store._id,
    tenantId: store.tenantId,
    isDeleted: false
  })
    .populate('category', 'name slug')
    .populate('brand', 'name logo')
    .lean();

  return product ? serializeMongoDoc(product) : null;
}

// إنشاء منتج جديد
export async function createStoreProduct(
  storeSlug: string,
  data: any,
  tenantId: string
) {
  await connectToDatabase();
  
  const store = await Store.findOne({ slug: storeSlug });
  if (!store) throw new Error('Store not found');
  
  // التحقق من عدد المنتجات
  const productsCount = await Product.countDocuments({ storeId: store._id });
  const tenant = await Tenant.findById(tenantId);
  
  if (productsCount >= (tenant?.maxProducts || 100)) {
    throw new Error('You have reached the maximum number of products allowed');
  }
  
  const product = await Product.create({
    ...data,
    tenantId: store.tenantId,
    storeId: store._id,
    remainingQuantity: data.stockQuantity,
    profitMargin: ((data.sellingPrice - data.purchasePrice) / data.sellingPrice) * 100
  });
  
  // تحديث إحصائيات المتجر
  await Store.findByIdAndUpdate(store._id, {
    $inc: { 'statistics.totalProducts': 1 }
  });
  
  return product;
}

// تحديث منتج
export async function updateStoreProduct(
  storeSlug: string,
  productId: string,
  data: any
) {
  await connectToDatabase();
  
  const store = await Store.findOne({ slug: storeSlug });
  if (!store) throw new Error('Store not found');
  
  if (data.sellingPrice && data.purchasePrice) {
    data.profitMargin = ((data.sellingPrice - data.purchasePrice) / data.sellingPrice) * 100;
  }
  
  if (data.stockQuantity !== undefined && data.soldQuantity !== undefined) {
    data.remainingQuantity = data.stockQuantity - data.soldQuantity;
  }
  
  return await Product.findOneAndUpdate(
    { _id: productId, storeId: store._id },
    { ...data, updatedAt: new Date() },
    { new: true, runValidators: true }
  ).lean();
}

// حذف منتج
export async function deleteStoreProduct(storeSlug: string, productId: string) {
  await connectToDatabase();
  
  const store = await Store.findOne({ slug: storeSlug });
  if (!store) throw new Error('Store not found');
  
  const product = await Product.findOneAndUpdate(
    { _id: productId, storeId: store._id },
    { isDeleted: true, deletedAt: new Date() }
  );
  
  // تحديث إحصائيات المتجر
  await Store.findByIdAndUpdate(store._id, {
    $inc: { 'statistics.totalProducts': -1 }
  });
  
  return product;
}

// تحديث مخزون المنتج
export async function updateProductStock(
  storeSlug: string,
  productId: string,
  quantity: number,
  type: 'add' | 'remove' | 'set'
) {
  await connectToDatabase();
  
  const store = await Store.findOne({ slug: storeSlug });
  if (!store) throw new Error('Store not found');
  
  const product = await Product.findOne({ _id: productId, storeId: store._id });
  if (!product) throw new Error('Product not found');
  
  let newStock = product.stockQuantity;
  
  switch (type) {
    case 'add':
      newStock += quantity;
      break;
    case 'remove':
      newStock -= quantity;
      break;
    case 'set':
      newStock = quantity;
      break;
  }
  
  if (newStock < 0) throw new Error('Stock cannot be negative');
  
  product.stockQuantity = newStock;
  product.remainingQuantity = newStock - product.soldQuantity;
  await product.save();
  
  return product;
}
