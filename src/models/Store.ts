// src/models/Store.ts
import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IStore extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  slug: string;
  
  // معلومات أساسية (لغة واحدة)
  name: string;                    // اسم المتجر
  nameEn?: string;
  description: string;             // وصف المتجر
  descriptionEn?: string;
  shortBio?: string;               // نبذة مختصرة
  shortBioEn?: string;
  
  // الوسائط
  logo?: string;
  logoPublicId?: string;
  coverImage?: string;
  coverPublicId?: string;
  coverImages?: Array<{
    url: string;
    publicId?: string;
    alt?: string;
  }>;
  favicon?: string;
  faviconPublicId?: string;
  
  // معلومات التواصل
  email: string;
  phone?: string;
  address?: string;
  
  // إعدادات المتجر
  settings: {
    currency: string;
    language: string;
    timezone: string;
    dateFormat: string;
    themePreset?: string;
    theme: {
      primaryColor: string;
      secondaryColor: string;
    };
  };
  
  // SEO
  seo: {
    title?: string;
    description?: string;
    keywords: string[];
  };
  
  // الاحصائيات
  statistics: {
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    totalCustomers: number;
  };
  
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ✅ فلديشن إضافية للحقول
const StoreSchema = new Schema<IStore>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, "معرف المستأجر مطلوب"],
    },
    slug: {
      type: String,
      required: [true, "رابط المتجر مطلوب"],
      unique: true,
      lowercase: true,
      trim: true,
      minlength: [3, "رابط المتجر يجب أن يكون على الأقل 3 أحرف"],
      maxlength: [50, "رابط المتجر لا يمكن أن يتجاوز 50 حرف"],
      match: [/^[a-z0-9-]+$/, "رابط المتجر يمكن أن يحتوي فقط على أحرف صغيرة وأرقام وشرطات"],
    },
    name: {
      type: String,
      required: [true, "اسم المتجر مطلوب"],
      trim: true,
      minlength: [2, "اسم المتجر يجب أن يكون على الأقل 2 أحرف"],
      maxlength: [100, "اسم المتجر لا يمكن أن يتجاوز 100 حرف"],
    },
    nameEn: {
      type: String,
      trim: true,
      maxlength: [100, "Store name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "وصف المتجر مطلوب"],
      trim: true,
      minlength: [10, "وصف المتجر يجب أن يكون على الأقل 10 أحرف"],
      maxlength: [500, "وصف المتجر لا يمكن أن يتجاوز 500 حرف"],
    },
    descriptionEn: {
      type: String,
      trim: true,
      maxlength: [2000, "Store description cannot exceed 2000 characters"],
    },
    shortBio: {
      type: String,
      trim: true,
      maxlength: [160, "النص التعريفي لا يمكن أن يتجاوز 160 حرف"],
    },
    shortBioEn: {
      type: String,
      trim: true,
      maxlength: [200, "Short bio cannot exceed 200 characters"],
    },
    logo: { type: String },
    logoPublicId: { type: String },
    coverImage: { type: String },
    coverPublicId: { type: String },
    coverImages: [
      {
        url: { type: String, required: true },
        publicId: { type: String },
        alt: { type: String },
      },
    ],
    favicon: { type: String },
    faviconPublicId: { type: String },
    email: {
      type: String,
      required: [true, "البريد الإلكتروني مطلوب"],
      lowercase: true,
      trim: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "البريد الإلكتروني غير صالح"],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/, "رقم الهاتف غير صالح"],
    },
    address: { type: String, trim: true, maxlength: [200, "العنوان لا يمكن أن يتجاوز 200 حرف"] },
    settings: {
      currency: { type: String, default: 'EGP', enum: ['EGP', 'USD', 'SAR', 'AED'] },
      language: { type: String, default: 'ar', enum: ['ar', 'en'] },
      timezone: { type: String, default: 'Africa/Cairo' },
      dateFormat: { type: String, default: 'DD/MM/YYYY' },
      themePreset: { type: String, default: 'modern' },
      theme: {
        primaryColor: { type: String, default: '#f97316', match: /^#[0-9A-Fa-f]{6}$/ },
        secondaryColor: { type: String, default: '#10b981', match: /^#[0-9A-Fa-f]{6}$/ },
      },
    },
    seo: {
      title: { type: String, maxlength: [60, "عنوان SEO لا يمكن أن يتجاوز 60 حرف"] },
      description: { type: String, maxlength: [160, "وصف SEO لا يمكن أن يتجاوز 160 حرف"] },
      keywords: [{ type: String }],
    },
    statistics: {
      totalProducts: { type: Number, default: 0, min: 0 },
      totalOrders: { type: Number, default: 0, min: 0 },
      totalRevenue: { type: Number, default: 0, min: 0 },
      totalCustomers: { type: Number, default: 0, min: 0 },
    },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes
StoreSchema.index({ tenantId: 1, slug: 1 }, { unique: true });
StoreSchema.index({ slug: 1 });
StoreSchema.index({ tenantId: 1, isActive: 1 });
StoreSchema.index({ name: 'text', description: 'text' });

export default mongoose.models.Store || mongoose.model<IStore>('Store', StoreSchema);
