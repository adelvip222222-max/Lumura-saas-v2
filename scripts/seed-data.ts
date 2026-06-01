// scripts/seed-tenant-data.ts
/**
 * سكريبت لإضافة بيانات تجريبية لمستأجر ومتجر محددين
 * تشغيل: npx tsx scripts/seed-tenant-data.ts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import bcrypt from "bcryptjs";

// تحميل متغيرات البيئة
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { connectToDatabase } from "@/lib/db/mongodb";
import Tenant from "@/models/Tenant";
import Store from "@/models/Store";
import Category from "@/models/Category";
import Product from "@/models/Product";
import Brand from "@/models/Brand";
import User from "@/models/User";
import Order from "@/models/Order";

// المعرفات المحددة
const TENANT_ID = new mongoose.Types.ObjectId("6a1c1c661503a5090c666ea6");
const STORE_ID = new mongoose.Types.ObjectId("6a1c1c661503a5090c666ea8");

// قائمة العملاء (للتسجيل)
const customersData = [
  {
    name: "أحمد محمد",
    email: "ahmed@example.com",
    password: "customer123",
    phone: "01012345678",
    address: "شارع النيل، القاهرة",
  },
  {
    name: "سارة أحمد",
    email: "sara@example.com",
    password: "customer123",
    phone: "01123456789",
    address: "شارع الهرم، الجيزة",
  },
  {
    name: "محمد علي",
    email: "mohamed@example.com",
    password: "customer123",
    phone: "01234567890",
    address: "شارع المعادي، القاهرة",
  },
  {
    name: "فاطمة حسن",
    email: "fatma@example.com",
    password: "customer123",
    phone: "01098765432",
    address: "شارع الشروق، القاهرة الجديدة",
  },
  {
    name: "عمر خالد",
    email: "omar@example.com",
    password: "customer123",
    phone: "01156789012",
    address: "شارع الميريلاند، مدينة نصر",
  },
];

async function seedTenantData() {
  try {
    console.log("🚀 جاري الاتصال بقاعدة البيانات...");
    await connectToDatabase();

    console.log("=" .repeat(60));
    console.log("📦 بدء إضافة البيانات التجريبية");
    console.log(`   Tenant ID: ${TENANT_ID}`);
    console.log(`   Store ID: ${STORE_ID}`);
    console.log("=" .repeat(60));

    // 1️⃣ التحقق من وجود المستأجر والمتجر
    console.log("\n🔍 التحقق من وجود المستأجر والمتجر...");
    
    let tenant = await Tenant.findById(TENANT_ID);
    if (!tenant) {
      console.log("📦 إنشاء مستأجر جديد...");
      const hashedPassword = await bcrypt.hash("admin123", 10);
      tenant = await Tenant.create({
        _id: TENANT_ID,
        slug: "memodev-store",
        name: "MEMO DEV Store",
        email: "admin@memodevstore.com",
        password: hashedPassword,
        role: "tenant_admin",
        plan: "YEARLY",
        status: "ACTIVE",
        isActive: true,
        subscriptionStart: new Date(),
        subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        maxStores: 5,
        maxProducts: 1000,
        maxStaff: 10,
      });
      console.log(`✅ تم إنشاء المستأجر: ${tenant.name}`);
    } else {
      console.log(`✅ المستأجر موجود: ${tenant.name}`);
    }

    let store = await Store.findById(STORE_ID);
    if (!store) {
      console.log("📦 إنشاء متجر جديد...");
      store = await Store.create({
        _id: STORE_ID,
        tenantId: TENANT_ID,
        slug: "memodev",
        name: "متجر MEMO DEV",
        nameEn: "MEMO DEV Store",
        description: "متجر إلكتروني متخصص في المنتجات التقنية والمنزلية",
        descriptionEn: "Online store specializing in tech and home products",
        shortBio: "أفضل المنتجات بأفضل الأسعار",
        shortBioEn: "Best products at best prices",
        email: "store@memodevstore.com",
        phone: "0223456789",
        address: "القاهرة، مصر",
        isActive: true,
        settings: {
          currency: "EGP",
          language: "ar",
          timezone: "Africa/Cairo",
          dateFormat: "DD/MM/YYYY",
          theme: { primaryColor: "#f97316", secondaryColor: "#10b981" },
        },
        statistics: {
          totalProducts: 0,
          totalOrders: 0,
          totalRevenue: 0,
          totalCustomers: 0,
        },
      });
      console.log(`✅ تم إنشاء المتجر: ${store.name}`);
    } else {
      console.log(`✅ المتجر موجود: ${store.name}`);
    }

    // 2️⃣ إنشاء العلامات التجارية
    console.log("\n🏷️ إنشاء العلامات التجارية...");
    
    await Brand.deleteMany({ storeId: STORE_ID });
    
    const brandsData = [
      { name: "Apple", nameAr: "أبل", slug: "apple", logo: "https://picsum.photos/100/100?random=1", isActive: true, isFeatured: true, sortOrder: 1 },
      { name: "Samsung", nameAr: "سامسونج", slug: "samsung", logo: "https://picsum.photos/100/100?random=2", isActive: true, isFeatured: true, sortOrder: 2 },
      { name: "Nike", nameAr: "نايك", slug: "nike", logo: "https://picsum.photos/100/100?random=3", isActive: true, isFeatured: true, sortOrder: 3 },
      { name: "Adidas", nameAr: "أديداس", slug: "adidas", logo: "https://picsum.photos/100/100?random=4", isActive: true, isFeatured: false, sortOrder: 4 },
      { name: "Sony", nameAr: "سوني", slug: "sony", logo: "https://picsum.photos/100/100?random=5", isActive: true, isFeatured: true, sortOrder: 5 },
      { name: "LG", nameAr: "إل جي", slug: "lg", logo: "https://picsum.photos/100/100?random=6", isActive: true, isFeatured: false, sortOrder: 6 },
    ];
    
    const brands = [];
    for (const brandData of brandsData) {
      const brand = await Brand.create({
        tenantId: TENANT_ID,
        storeId: STORE_ID,
        ...brandData,
      });
      brands.push(brand);
      console.log(`   ✓ ${brand.name}`);
    }
    console.log(`✅ تم إنشاء ${brands.length} علامات تجارية`);

    // 3️⃣ إنشاء الفئات والفئات الفرعية
    console.log("\n📂 إنشاء الفئات والفئات الفرعية...");
    
    await Category.deleteMany({ storeId: STORE_ID });
    
    const categoriesData = [
      {
        name: "Electronics",
        nameAr: "الإلكترونيات",
        slug: "electronics",
        description: "Electronic products and gadgets",
        descriptionAr: "المنتجات الإلكترونية والأجهزة",
        icon: "📱",
        image: "https://picsum.photos/400/400?random=10",
        isActive: true,
        isFeatured: true,
        sortOrder: 1,
        subcategories: [
          { name: "Smartphones", nameAr: "الهواتف الذكية", slug: "smartphones", isActive: true, sortOrder: 0 },
          { name: "Laptops", nameAr: "أجهزة الكمبيوتر المحمول", slug: "laptops", isActive: true, sortOrder: 1 },
          { name: "Tablets", nameAr: "الأجهزة اللوحية", slug: "tablets", isActive: true, sortOrder: 2 },
          { name: "Accessories", nameAr: "الإكسسوارات", slug: "accessories", isActive: true, sortOrder: 3 },
        ],
      },
      {
        name: "Fashion",
        nameAr: "الموضة",
        slug: "fashion",
        description: "Clothing and fashion accessories",
        descriptionAr: "الملابس وإكسسوارات الموضة",
        icon: "👕",
        image: "https://picsum.photos/400/400?random=11",
        isActive: true,
        isFeatured: true,
        sortOrder: 2,
        subcategories: [
          { name: "Men", nameAr: "رجالي", slug: "men", isActive: true, sortOrder: 0 },
          { name: "Women", nameAr: "نسائي", slug: "women", isActive: true, sortOrder: 1 },
          { name: "Kids", nameAr: "أطفال", slug: "kids", isActive: true, sortOrder: 2 },
          { name: "Shoes", nameAr: "أحذية", slug: "shoes", isActive: true, sortOrder: 3 },
        ],
      },
      {
        name: "Home & Garden",
        nameAr: "المنزل والحديقة",
        slug: "home-garden",
        description: "Home decor and garden items",
        descriptionAr: "ديكور المنزل وحديقة المنزل",
        icon: "🏠",
        image: "https://picsum.photos/400/400?random=12",
        isActive: true,
        isFeatured: false,
        sortOrder: 3,
        subcategories: [
          { name: "Furniture", nameAr: "الأثاث", slug: "furniture", isActive: true, sortOrder: 0 },
          { name: "Decor", nameAr: "الديكور", slug: "decor", isActive: true, sortOrder: 1 },
          { name: "Kitchen", nameAr: "المطبخ", slug: "kitchen", isActive: true, sortOrder: 2 },
          { name: "Garden", nameAr: "الحديقة", slug: "garden", isActive: true, sortOrder: 3 },
        ],
      },
      {
        name: "Sports",
        nameAr: "الرياضة",
        slug: "sports",
        description: "Sports equipment and clothing",
        descriptionAr: "المعدات الرياضية والملابس",
        icon: "⚽",
        image: "https://picsum.photos/400/400?random=13",
        isActive: true,
        isFeatured: false,
        sortOrder: 4,
        subcategories: [
          { name: "Equipment", nameAr: "المعدات", slug: "equipment", isActive: true, sortOrder: 0 },
          { name: "Clothing", nameAr: "الملابس", slug: "clothing", isActive: true, sortOrder: 1 },
          { name: "Shoes", nameAr: "الأحذية", slug: "shoes", isActive: true, sortOrder: 2 },
        ],
      },
    ];
    
    const categories = [];
    for (const catData of categoriesData) {
      const category = await Category.create({
        tenantId: TENANT_ID,
        storeId: STORE_ID,
        ...catData,
      });
      categories.push(category);
      console.log(`   ✓ ${category.name}`);
    }
    console.log(`✅ تم إنشاء ${categories.length} فئات رئيسية`);

    // 4️⃣ إنشاء المنتجات
    console.log("\n📱 إنشاء المنتجات...");
    
    await Product.deleteMany({ storeId: STORE_ID });
    
    const productsData = [
      // Electronics - Smartphones
      {
        name: "iPhone 15 Pro",
        nameAr: "آيفون 15 برو",
        category: categories[0]._id,
        subcategoryId: categories[0].subcategories[0]._id,
        subcategoryName: "Smartphones",
        brand: brands[0]._id,
        sku: "IPHONE15P001",
        purchasePrice: 800,
        wholesalePrice: 850,
        sellingPrice: 999,
        discountPrice: 899,
        stock: 50,
        description: "Latest Apple iPhone with A17 Pro chip, titanium design, and advanced camera system",
        descriptionAr: "أحدث آيفون من أبل مع شريحة A17 Pro وتصميم من التيتانيوم ونظام كاميرا متقدم",
        isFeatured: true,
        tags: ["apple", "iphone", "smartphone", "premium"],
      },
      {
        name: "Samsung Galaxy S24 Ultra",
        nameAr: "سامسونج جلاكسي S24 الترا",
        category: categories[0]._id,
        subcategoryId: categories[0].subcategories[0]._id,
        subcategoryName: "Smartphones",
        brand: brands[1]._id,
        sku: "SAMS24U001",
        purchasePrice: 700,
        wholesalePrice: 750,
        sellingPrice: 899,
        discountPrice: 799,
        stock: 40,
        description: "Samsung's flagship with AI features and amazing camera",
        descriptionAr: "هاتف سامسونج الرائد مع ميزات الذكاء الاصطناعي وكاميرا رائعة",
        isFeatured: true,
        tags: ["samsung", "galaxy", "smartphone", "android"],
      },
      // Electronics - Laptops
      {
        name: "MacBook Pro 16",
        nameAr: "ماك بوك برو 16",
        category: categories[0]._id,
        subcategoryId: categories[0].subcategories[1]._id,
        subcategoryName: "Laptops",
        brand: brands[0]._id,
        sku: "MBP16001",
        purchasePrice: 1500,
        wholesalePrice: 1600,
        sellingPrice: 1999,
        stock: 20,
        description: "Powerful laptop with M3 Pro chip for professionals",
        descriptionAr: "كمبيوتر محمول قوي بشريحة M3 Pro للمحترفين",
        isFeatured: true,
        tags: ["apple", "macbook", "laptop", "pro"],
      },
      // Electronics - Accessories
      {
        name: "AirPods Pro 2",
        nameAr: "آيربودز برو 2",
        category: categories[0]._id,
        subcategoryId: categories[0].subcategories[3]._id,
        subcategoryName: "Accessories",
        brand: brands[0]._id,
        sku: "APPRO2001",
        purchasePrice: 150,
        wholesalePrice: 180,
        sellingPrice: 249,
        discountPrice: 199,
        stock: 100,
        description: "Noise-cancelling wireless earbuds",
        descriptionAr: "سماعات لاسلكية عازلة للضوضاء",
        isFeatured: true,
        tags: ["apple", "airpods", "audio", "wireless"],
      },
      // Fashion - Men
      {
        name: "Premium Cotton T-Shirt",
        nameAr: "تي شيرت قطني بريميوم",
        category: categories[1]._id,
        subcategoryId: categories[1].subcategories[0]._id,
        subcategoryName: "Men",
        brand: brands[2]._id,
        sku: "TSHIRT001",
        purchasePrice: 10,
        wholesalePrice: 12,
        sellingPrice: 24.99,
        discountPrice: 19.99,
        stock: 200,
        description: "Comfortable and durable cotton t-shirt",
        descriptionAr: "تي شيرت قطني مريح ومتين",
        isFeatured: false,
        tags: ["clothing", "men", "tshirt", "cotton"],
      },
      {
        name: "Classic Denim Jeans",
        nameAr: "جينز كلاسيكي",
        category: categories[1]._id,
        subcategoryId: categories[1].subcategories[0]._id,
        subcategoryName: "Men",
        brand: brands[3]._id,
        sku: "JEANS001",
        purchasePrice: 25,
        wholesalePrice: 30,
        sellingPrice: 59.99,
        stock: 150,
        description: "Timeless denim jeans for all occasions",
        descriptionAr: "جينز كلاسيكي لجميع المناسبات",
        isFeatured: true,
        tags: ["clothing", "men", "jeans", "denim"],
      },
      // Fashion - Women
      {
        name: "Elegant Summer Dress",
        nameAr: "فستان صيفي أنيق",
        category: categories[1]._id,
        subcategoryId: categories[1].subcategories[1]._id,
        subcategoryName: "Women",
        brand: brands[2]._id,
        sku: "DRESS001",
        purchasePrice: 30,
        wholesalePrice: 35,
        sellingPrice: 74.99,
        stock: 80,
        description: "Light and breathable summer dress",
        descriptionAr: "فستان صيفي خفيف وقابل للتهوية",
        isFeatured: true,
        tags: ["clothing", "women", "dress", "summer"],
      },
      // Home & Garden
      {
        name: "Modern Coffee Table",
        nameAr: "طاولة قهوة حديثة",
        category: categories[2]._id,
        subcategoryId: categories[2].subcategories[0]._id,
        subcategoryName: "Furniture",
        brand: brands[4]._id,
        sku: "TABLE001",
        purchasePrice: 150,
        wholesalePrice: 180,
        sellingPrice: 299.99,
        discountPrice: 249.99,
        stock: 30,
        description: "Stylish coffee table for modern living rooms",
        descriptionAr: "طاولة قهوة أنيقة لغرف المعيشة الحديثة",
        isFeatured: true,
        tags: ["furniture", "home", "table", "modern"],
      },
      // Sports
      {
        name: "Yoga Mat Premium",
        nameAr: "حصيرة اليوجا بريميوم",
        category: categories[3]._id,
        subcategoryId: categories[3].subcategories[0]._id,
        subcategoryName: "Equipment",
        brand: brands[2]._id,
        sku: "YOGA001",
        purchasePrice: 20,
        wholesalePrice: 25,
        sellingPrice: 44.99,
        stock: 120,
        description: "Eco-friendly yoga mat with non-slip surface",
        descriptionAr: "حصيرة يوجا صديقة للبيئة بسطح غير قابل للانزلاق",
        isFeatured: false,
        tags: ["sports", "yoga", "fitness", "exercise"],
      },
    ];

    const products = [];
    for (const p of productsData) {
      const profitMargin = ((p.sellingPrice - p.purchasePrice) / p.sellingPrice) * 100;
      const slug = p.name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\-]/g, "");
      
      const product = await Product.create({
        tenantId: TENANT_ID,
        storeId: STORE_ID,
        name: p.name,
        nameAr: p.nameAr,
        slug: slug,
        description: p.description,
        descriptionAr: p.descriptionAr,
        shortDescription: p.description.substring(0, 100),
        shortDescriptionAr: p.descriptionAr?.substring(0, 100),
        sku: p.sku,
        category: p.category,
        subcategoryId: p.subcategoryId,
        subcategoryName: p.subcategoryName,
        brand: p.brand,
        purchasePrice: p.purchasePrice,
        wholesalePrice: p.wholesalePrice,
        sellingPrice: p.sellingPrice,
        discountPrice: p.discountPrice,
        profitMargin: profitMargin,
        stockQuantity: p.stock,
        soldQuantity: 0,
        remainingQuantity: p.stock,
        lowStockThreshold: 10,
        unitType: "piece",
        isFeatured: p.isFeatured,
        isActive: true,
        isDeleted: false,
        images: [{
          url: `https://picsum.photos/500/500?random=${p.sku}`,
          publicId: `product-${p.sku}`,
          alt: p.name,
          isPrimary: true,
        }],
        thumbnail: `https://picsum.photos/200/200?random=${p.sku}`,
        tags: p.tags,
        specifications: [
          { key: "Brand", value: p.name.split(" ")[0] },
          { key: "Warranty", value: "1 Year" },
          { key: "Condition", value: "New" },
        ],
      });
      products.push(product);
      console.log(`   ✓ ${product.name}`);
    }
    console.log(`✅ تم إنشاء ${products.length} منتج`);

    // 5️⃣ إنشاء العملاء (المستخدمين)
    console.log("\n👥 إنشاء العملاء...");
    
    await User.deleteMany({ storeId: STORE_ID, role: "customer" });
    
    const customers = [];
    for (const customerData of customersData) {
      const hashedPassword = await bcrypt.hash(customerData.password, 10);
      const customer = await User.create({
        name: customerData.name,
        email: customerData.email,
        password: hashedPassword,
        phone: customerData.phone,
        role: "customer",
        tenantId: TENANT_ID,
        storeId: STORE_ID,
        isActive: true,
        addresses: [{
          fullName: customerData.name,
          phone: customerData.phone,
          street: customerData.address,
          city: "القاهرة",
          state: "القاهرة",
          country: "مصر",
          zipCode: "12345",
          isDefault: true,
        }],
      });
      customers.push(customer);
      console.log(`   ✓ ${customer.name} (${customer.email})`);
    }
    console.log(`✅ تم إنشاء ${customers.length} عميل`);

    // 6️⃣ إنشاء طلبات تجريبية
    console.log("\n📦 إنشاء الطلبات...");
    
    await Order.deleteMany({ storeId: STORE_ID });
    
    const orders = [];
    const statuses = ["pending", "confirmed", "processing", "shipped", "delivered"];
    
    for (let i = 0; i < 10; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const randomProducts = products.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 1);
      
      const items = randomProducts.map(p => ({
        productId: p._id,
        name: p.name,
        slug: p.slug,
        image: p.images?.[0]?.url || "",
        sku: p.sku,
        price: p.discountPrice || p.sellingPrice,
        quantity: Math.floor(Math.random() * 3) + 1,
        subtotal: (p.discountPrice || p.sellingPrice) * (Math.floor(Math.random() * 3) + 1),
      }));
      
      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const tax = subtotal * 0.14;
      const shipping = subtotal > 500 ? 0 : 50;
      const total = subtotal + tax + shipping;
      
      const orderNumber = `ORD-${Date.now()}-${i + 1}`;
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 30));
      
      const order = await Order.create({
        orderNumber: orderNumber,
        userId: customer._id,
        storeId: STORE_ID,
        tenantId: TENANT_ID,
        items: items,
        shippingAddress: customer.addresses[0],
        subtotal: subtotal,
        tax: tax,
        shipping: shipping,
        discount: 0,
        total: total,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        paymentStatus: ["paid", "pending"][Math.floor(Math.random() * 2)],
        paymentMethod: Math.random() > 0.5 ? "cash_on_delivery" : "stripe",
        notes: "",
        createdAt: orderDate,
        updatedAt: orderDate,
      });
      orders.push(order);
      console.log(`   ✓ طلب #${order.orderNumber} - ${customer.name} - ${order.total} ج.م`);
    }
    console.log(`✅ تم إنشاء ${orders.length} طلب`);

    // 7️⃣ تحديث إحصائيات المتجر
    await Store.findByIdAndUpdate(STORE_ID, {
      "statistics.totalProducts": products.length,
      "statistics.totalOrders": orders.length,
      "statistics.totalRevenue": orders.reduce((sum, o) => sum + o.total, 0),
      "statistics.totalCustomers": customers.length,
    });

    // 8️⃣ عرض بيانات العملاء للتسجيل
    console.log("\n" + "=".repeat(60));
    console.log("✅ اكتمل إضافة البيانات التجريبية بنجاح!");
    console.log("=".repeat(60));
    console.log(`\n📊 الملخص:`);
    console.log(`   • المستأجر: ${tenant.name} (${tenant._id})`);
    console.log(`   • المتجر: ${store.name} (${store._id})`);
    console.log(`   • العلامات التجارية: ${brands.length}`);
    console.log(`   • الفئات: ${categories.length}`);
    console.log(`   • المنتجات: ${products.length}`);
    console.log(`   • العملاء: ${customers.length}`);
    console.log(`   • الطلبات: ${orders.length}`);
    
    console.log("\n🔑 بيانات العملاء للتسجيل الدخول ومتابعة الطلبات:");
    console.log("-".repeat(60));
    for (const customer of customers) {
      console.log(`\n   👤 ${customer.name}`);
      console.log(`      📧 البريد الإلكتروني: ${customer.email}`);
      console.log(`      🔑 كلمة المرور: customer123`);
      console.log(`      📱 الهاتف: ${customer.phone}`);
    }
    
    console.log("\n🌐 روابط مهمة:");
    console.log(`   • صفحة المتجر: http://localhost:3000/${store.slug}`);
    console.log(`   • تسجيل دخول العميل: http://localhost:3000/${store.slug}/login`);
    console.log(`   • لوحة تحكم المستأجر: http://localhost:3000/dashboard`);
    console.log(`   • إدارة المتجر: http://localhost:3000/dashboard/stores/${store.slug}`);
    
    console.log("\n🔐 بيانات دخول المستأجر:");
    console.log(`   📧 البريد الإلكتروني: admin@memodevstore.com`);
    console.log(`   🔑 كلمة المرور: admin123`);
    
    console.log("\n✨ يمكن للعملاء الآن:");
    console.log("   1. تسجيل الدخول باستخدام بياناتهم أعلاه");
    console.log("   2. متابعة طلباتهم السابقة");
    console.log("   3. إنشاء طلبات جديدة");
    console.log("\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ حدث خطأ:", error);
    process.exit(1);
  }
}

seedTenantData();