# create-saas-mongodb.ps1
param(
    [string]$ProjectName = "lumora-saas"
)

Write-Host "🚀 بدء بناء مشروع SaaS Multi-Tenant مع MongoDB" -ForegroundColor Green

# إنشاء المجلد الرئيسي
New-Item -Path $ProjectName -ItemType Directory -Force
Set-Location $ProjectName

# 1. إنشاء هيكل المشروع
Write-Host "📁 إنشاء هيكل المشروع..." -ForegroundColor Yellow

$folders = @(
    "src/app/(platform)/admin/tenants",
    "src/app/(platform)/admin/subscriptions",
    "src/app/(platform)/admin/analytics",
    "src/app/(store)/[slug]/products",
    "src/app/(store)/[slug]/categories",
    "src/app/(store)/[slug]/cart",
    "src/app/(store)/[slug]/checkout",
    "src/app/api/auth",
    "src/app/api/tenants",
    "src/app/api/subscriptions",
    "src/app/api/webhooks/stripe",
    "src/components/platform",
    "src/components/tenant",
    "src/components/shared",
    "src/lib/db",
    "src/lib/auth",
    "src/lib/tenant",
    "src/lib/subscription",
    "src/middleware",
    "src/models",
    "src/hooks",
    "src/types",
    "src/utils"
)

foreach ($folder in $folders) {
    New-Item -Path $folder -ItemType Directory -Force | Out-Null
}

# 2. إنشاء package.json
Write-Host "📦 إنشاء الملفات الأساسية..." -ForegroundColor Yellow

@"
{
  "name": "$ProjectName",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "seed": "ts-node --project tsconfig.scripts.json scripts/seed.ts"
  },
  "dependencies": {
    "next": "14.2.3",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "mongoose": "^8.4.0",
    "next-auth": "^4.24.6",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "stripe": "^15.5.0",
    "cookies-next": "^4.1.1",
    "axios": "^1.7.2",
    "zod": "^3.23.8",
    "tailwindcss": "^3.4.3"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^20.12.12",
    "@types/react": "^18.3.2",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.4.5",
    "ts-node": "^10.9.2"
  }
}
"@ | Out-File -FilePath "package.json" -Encoding UTF8

# 3. إنشاء tsconfig.json
@"
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
"@ | Out-File -FilePath "tsconfig.json" -Encoding UTF8

# 4. إنشاء نماذج MongoDB (Models)
Write-Host "🗄️ إنشاء نماذج MongoDB..." -ForegroundColor Yellow

# src/models/Tenant.ts
@"
import mongoose, { Schema, Document } from 'mongoose';

export interface ITenant extends Document {
  slug: string;
  name: string;
  email: string;
  logo?: string;
  plan: 'MONTHLY' | 'SEMI_ANNUAL' | 'YEARLY';
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
  subscriptionEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TenantSchema = new Schema({
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  logo: { type: String },
  plan: { 
    type: String, 
    enum: ['MONTHLY', 'SEMI_ANNUAL', 'YEARLY'],
    default: 'MONTHLY'
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACTIVE', 'SUSPENDED', 'EXPIRED'],
    default: 'PENDING'
  },
  subscriptionEnd: { type: Date },
}, { timestamps: true });

export default mongoose.models.Tenant || mongoose.model<ITenant>('Tenant', TenantSchema);
"@ | Out-File -FilePath "src/models/Tenant.ts" -Encoding UTF8

# src/models/User.ts
@"
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'TENANT_STAFF' | 'END_CUSTOMER';
  tenantId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: {
    type: String,
    enum: ['SUPER_ADMIN', 'TENANT_ADMIN', 'TENANT_STAFF', 'END_CUSTOMER'],
    default: 'END_CUSTOMER'
  },
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant' }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
"@ | Out-File -FilePath "src/models/User.ts" -Encoding UTF8

# src/models/Store.ts
@"
import mongoose, { Schema, Document } from 'mongoose';

export interface IStore extends Document {
  slug: string;
  name: string;
  tenantId: mongoose.Types.ObjectId;
  logo?: string;
  settings: {
    currency: string;
    language: string;
    theme: string;
  };
  createdAt: Date;
}

const StoreSchema = new Schema({
  slug: { type: String, required: true },
  name: { type: String, required: true },
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  logo: { type: String },
  settings: {
    currency: { type: String, default: 'EGP' },
    language: { type: String, default: 'ar' },
    theme: { type: String, default: 'light' }
  }
}, { timestamps: true });

StoreSchema.index({ tenantId: 1, slug: 1 }, { unique: true });

export default mongoose.models.Store || mongoose.model<IStore>('Store', StoreSchema);
"@ | Out-File -FilePath "src/models/Store.ts" -Encoding UTF8

# src/models/Product.ts
@"
import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number;
  images: string[];
  category: string;
  stock: number;
  tenantId: mongoose.Types.ObjectId;
  storeId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ProductSchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  comparePrice: { type: Number },
  images: [{ type: String }],
  category: { type: String },
  stock: { type: Number, default: 0 },
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true }
}, { timestamps: true });

ProductSchema.index({ tenantId: 1, slug: 1 }, { unique: true });

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
"@ | Out-File -FilePath "src/models/Product.ts" -Encoding UTF8

# src/models/Order.ts
@"
import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  orderNumber: string;
  items: Array<{
    productId: mongoose.Types.ObjectId;
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  tenantId: mongoose.Types.ObjectId;
  storeId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const OrderSchema = new Schema({
  orderNumber: { type: String, required: true, unique: true },
  items: [{
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    quantity: Number
  }],
  total: { type: Number, required: true },
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING'
  },
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    address: { type: String, required: true }
  },
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
"@ | Out-File -FilePath "src/models/Order.ts" -Encoding UTF8

# 5. إنشاء الاتصال بقاعدة البيانات
Write-Host "🔌 إنشاء اتصال MongoDB..." -ForegroundColor Yellow

# src/lib/db/mongodb.ts
@"
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI environment variable');
}

interface Cached {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: Cached;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then(() => mongoose);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
"@ | Out-File -FilePath "src/lib/db/mongodb.ts" -Encoding UTF8

# 6. إنشاء Tenant Actions
Write-Host "⚙️ إنشاء الـ Actions..." -ForegroundColor Yellow

# src/lib/tenant/tenant-actions.ts
@"
import { connectToDatabase } from '@/lib/db/mongodb';
import Tenant from '@/models/Tenant';
import Store from '@/models/Store';
import mongoose from 'mongoose';

export async function getTenantBySlug(slug: string) {
  await connectToDatabase();
  return await Tenant.findOne({ slug }).lean();
}

export async function getTenantById(id: string) {
  await connectToDatabase();
  return await Tenant.findById(id).lean();
}

export async function createTenant(data: {
  slug: string;
  name: string;
  email: string;
  plan?: string;
}) {
  await connectToDatabase();
  
  const tenant = await Tenant.create({
    ...data,
    plan: data.plan || 'MONTHLY',
    status: 'PENDING',
    subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  });
  
  // إنشاء متجر افتراضي للمستأجر
  await Store.create({
    slug: 'main',
    name: `${data.name} Store`,
    tenantId: tenant._id,
    settings: {
      currency: 'EGP',
      language: 'ar',
      theme: 'light'
    }
  });
  
  return tenant;
}

export async function updateTenantSubscription(
  tenantId: string,
  plan: 'MONTHLY' | 'SEMI_ANNUAL' | 'YEARLY'
) {
  await connectToDatabase();
  
  let duration = 30;
  if (plan === 'SEMI_ANNUAL') duration = 180;
  if (plan === 'YEARLY') duration = 365;
  
  return await Tenant.findByIdAndUpdate(
    tenantId,
    {
      plan,
      subscriptionEnd: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
      status: 'ACTIVE'
    },
    { new: true }
  );
}
"@ | Out-File -FilePath "src/lib/tenant/tenant-actions.ts" -Encoding UTF8

# src/lib/tenant/get-tenant-products.ts
@"
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/models/Product';
import mongoose from 'mongoose';

export async function getTenantProducts(tenantId: string, filters?: any) {
  await connectToDatabase();
  
  const query: any = { tenantId: new mongoose.Types.ObjectId(tenantId) };
  
  if (filters?.category) {
    query.category = filters.category;
  }
  
  if (filters?.search) {
    query.name = { $regex: filters.search, $options: 'i' };
  }
  
  return await Product.find(query).sort({ createdAt: -1 }).lean();
}

export async function getProductBySlug(slug: string, tenantId: string) {
  await connectToDatabase();
  return await Product.findOne({ slug, tenantId: new mongoose.Types.ObjectId(tenantId) }).lean();
}

export async function createProduct(data: any, tenantId: string) {
  await connectToDatabase();
  
  const product = await Product.create({
    ...data,
    tenantId: new mongoose.Types.ObjectId(tenantId),
    storeId: new mongoose.Types.ObjectId(data.storeId)
  });
  
  return product;
}
"@ | Out-File -FilePath "src/lib/tenant/get-tenant-products.ts" -Encoding UTF8

# 7. إنشاء API Routes
Write-Host "🌐 إنشاء API Routes..." -ForegroundColor Yellow

# src/app/api/tenants/route.ts
@"
import { NextRequest, NextResponse } from 'next/server';
import { createTenant, getTenantBySlug } from '@/lib/tenant/tenant-actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, name, email, plan } = body;
    
    // التحقق من وجود المستأجر
    const existingTenant = await getTenantBySlug(slug);
    if (existingTenant) {
      return NextResponse.json(
        { error: 'Tenant already exists' },
        { status: 400 }
      );
    }
    
    const tenant = await createTenant({ slug, name, email, plan });
    
    return NextResponse.json(tenant, { status: 201 });
  } catch (error) {
    console.error('Error creating tenant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
"@ | Out-File -FilePath "src/app/api/tenants/route.ts" -Encoding UTF8

# 8. إنشاء Middleware للتحقق من Tenant
Write-Host "🛡️ إنشاء Middleware..." -ForegroundColor Yellow

# src/middleware/tenant-middleware.ts
@"
import { NextRequest, NextResponse } from 'next/server';
import { getTenantBySlug } from '@/lib/tenant/tenant-actions';

export async function tenantMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const slug = pathname.split('/')[1]; // استخراج الـ slug من URL
  
  // تجاهل المسارات العامة
  if (pathname.startsWith('/api') || 
      pathname.startsWith('/_next') || 
      pathname.startsWith('/auth')) {
    return NextResponse.next();
  }
  
  if (slug && !pathname.startsWith('/admin')) {
    const tenant = await getTenantBySlug(slug);
    
    if (!tenant) {
      return NextResponse.redirect(new URL('/not-found', request.url));
    }
    
    // التحقق من صلاحية الاشتراك
    if (tenant.status !== 'ACTIVE') {
      return NextResponse.redirect(new URL('/subscription-expired', request.url));
    }
    
    // إضافة بيانات المستأجر للـ headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tenant-id', tenant._id.toString());
    requestHeaders.set('x-tenant-slug', tenant.slug);
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
  
  return NextResponse.next();
}
"@ | Out-File -FilePath "src/middleware/tenant-middleware.ts" -Encoding UTF8

# src/middleware.ts
@"
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { tenantMiddleware } from '@/middleware/tenant-middleware';

export async function middleware(request: NextRequest) {
  // تطبيق middleware المستأجر
  const tenantResponse = await tenantMiddleware(request);
  if (tenantResponse) return tenantResponse;
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
"@ | Out-File -FilePath "src/middleware.ts" -Encoding UTF8

# 9. إنشاء صفحات رئيسية
Write-Host "📄 إنشاء الصفحات..." -ForegroundColor Yellow

# src/app/(store)/[slug]/layout.tsx
@"
import { getTenantBySlug } from '@/lib/tenant/tenant-actions';
import { notFound } from 'next/navigation';

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  
  if (!tenant) {
    notFound();
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">{tenant.name}</h1>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
"@ | Out-File -FilePath "src/app/(store)/[slug]/layout.tsx" -Encoding UTF8

# src/app/(store)/[slug]/page.tsx
@"
import { getTenantBySlug } from '@/lib/tenant/tenant-actions';
import { getTenantProducts } from '@/lib/tenant/get-tenant-products';

export default async function StoreHomePage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  const products = await getTenantProducts(tenant._id.toString());
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-8">المنتجات</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((product: any) => (
          <div key={product._id} className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold">{product.name}</h3>
            <p className="text-green-600 mt-2">{product.price} ج.م</p>
          </div>
        ))}
      </div>
    </div>
  );
}
"@ | Out-File -FilePath "src/app/(store)/[slug]/page.tsx" -Encoding UTF8

# 10. إنشاء ملفات البيئة
Write-Host "⚙️ إنشاء ملفات البيئة..." -ForegroundColor Yellow

@"
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/lumora-saas

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-this

# JWT
JWT_SECRET=your-jwt-secret-change-this

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_SEMI_ANNUAL_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_...
"@ | Out-File -FilePath ".env.example" -Encoding UTF8

# 11. إنشاء Docker Compose
Write-Host "🐳 إنشاء Docker Compose..." -ForegroundColor Yellow

@"
version: '3.8'

services:
  mongodb:
    image: mongo:7
    container_name: lumora-mongodb
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
      MONGO_INITDB_DATABASE: lumora-saas
    volumes:
      - mongodb_data:/data/db

  mongo-express:
    image: mongo-express:latest
    container_name: lumora-mongo-express
    ports:
      - "8081:8081"
    environment:
      ME_CONFIG_MONGODB_ADMINUSERNAME: admin
      ME_CONFIG_MONGODB_ADMINPASSWORD: password
      ME_CONFIG_MONGODB_URL: mongodb://admin:password@mongodb:27017/
    depends_on:
      - mongodb

volumes:
  mongodb_data:
"@ | Out-File -FilePath "docker-compose.yml" -Encoding UTF8

# 12. إنشاء Script للإعداد الأولي
Write-Host "📝 إنشاء Scripts..." -ForegroundColor Yellow

# scripts/seed.ts
@"
import { connectToDatabase } from '../src/lib/db/mongodb';
import Tenant from '../src/models/Tenant';
import User from '../src/models/User';
import bcrypt from 'bcryptjs';

async function seed() {
  await connectToDatabase();
  
  // إنشاء مستأجر تجريبي
  const tenant = await Tenant.create({
    slug: 'lumora',
    name: 'Lumora Store',
    email: 'store@lumora.com',
    plan: 'YEARLY',
    status: 'ACTIVE',
    subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
  });
  
  // إنشاء مستخدم مدير للمستأجر
  const hashedPassword = await bcrypt.hash('password123', 10);
  await User.create({
    email: 'admin@lumora.com',
    password: hashedPassword,
    name: 'Admin User',
    role: 'TENANT_ADMIN',
    tenantId: tenant._id
  });
  
  console.log('✅ Database seeded successfully!');
  console.log(`Tenant Slug: lumora`);
  console.log(`Admin Email: admin@lumora.com`);
  console.log(`Password: password123`);
  
  process.exit(0);
}

seed().catch(console.error);
"@ | Out-File -FilePath "scripts/seed.ts" -Encoding UTF8

# 13. إنشاء README
Write-Host "📖 إنشاء README..." -ForegroundColor Yellow

@"
# Lumora SaaS Platform - MongoDB Version

## 🚀 منصة متعددة المستأجرين للتجارة الإلكترونية

### المتطلبات الأساسية
- Node.js 20+
- Docker & Docker Compose
- MongoDB (سيتم تشغيلها عبر Docker)

### التثبيت والتشغيل

\`\`\`bash
# 1. تثبيت الاعتماديات
npm install

# 2. تشغيل MongoDB
docker-compose up -d

# 3. نسخ ملف البيئة
cp .env.example .env

# 4. إعداد قاعدة البيانات
npm run seed

# 5. تشغيل المشروع
npm run dev
\`\`\`

### هيكل المشروع

\`\`\`
src/
├── app/
│   ├── (platform)/     # منصة الـ SaaS
│   └── (store)/        # متاجر المستأجرين (باستخدام slug)
├── models/             # نماذج MongoDB
├── lib/
│   ├── db/            # اتصال MongoDB
│   └── tenant/        # دوال المستأجرين
├── middleware.ts      # التحقق من المستأجرين
└── types/             # تعريفات TypeScript
\`\`\`

### الـ API Endpoints

- \`POST /api/tenants\` - إنشاء مستأجر جديد
- \`GET /api/tenants/[slug]\` - جلب بيانات المستأجر

### الاختبار

1. افتح \`http://localhost:3000/lumora\`
2. شاهد متجر Lumora
3. استخدم \`admin@lumora.com / password123\` للدخول كلوحة تحكم

### التعديلات المطلوبة على المشروع الحالي

لمزيد من التفاصيل، راجع ملف \`MIGRATION.md\`
"@ | Out-File -FilePath "README.md" -Encoding UTF8

Write-Host "✅ تم بناء المشروع بنجاح!" -ForegroundColor Green
Write-Host "📍 المسار: $(Get-Location)" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 الخطوات التالية:" -ForegroundColor Yellow
Write-Host "1. cd $ProjectName" -ForegroundColor White
Write-Host "2. npm install" -ForegroundColor White
Write-Host "3. docker-compose up -d" -ForegroundColor White
Write-Host "4. cp .env.example .env" -ForegroundColor White
Write-Host "5. npm run seed" -ForegroundColor White
Write-Host "6. npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "🌐 لاختبار المشروع:" -ForegroundColor Green
Write-Host "http://localhost:3000/lumora" -ForegroundColor Cyan