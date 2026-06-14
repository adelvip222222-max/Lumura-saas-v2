import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import bcrypt from "bcryptjs";

// Load Environment Variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: path.resolve(process.cwd(), ".env") });
}

import { connectToDatabase } from "@/lib/db/mongodb";
import Tenant from "@/models/Tenant";
import Store from "@/models/Store";
import Category from "@/models/Category";
import Product from "@/models/Product";
import Brand from "@/models/Brand";
import User from "@/models/User";
import Order from "@/models/Order";

const STORE_TEMPLATES = [
  { name: "أنيق للأزياء", nameEn: "Aneeq Fashion", type: "fashion", primaryColor: "#ec4899", bio: "أرقى خطوط الموضة والأزياء العصرية لكل العائلة" },
  { name: "تكنو كود", nameEn: "TechnoCode", type: "electronics", primaryColor: "#3b82f6", bio: "أحدث الأجهزة الذكية والإلكترونيات بأفضل الأسعار" },
  { name: "صيدلية الشفاء", nameEn: "Al Shifa Pharmacy", type: "pharmacy", primaryColor: "#10b981", bio: "رعايتكم الصحية هي أولويتنا القصوى دائماً" },
  { name: "سوبر ماركت البركة", nameEn: "Al Baraka Market", type: "supermarket", primaryColor: "#f59e0b", bio: "جميع مستلزماتكم المنزلية والغذائية الطازجة تحت سقف واحد" },
  { name: "بيت القهوة", nameEn: "Coffee House", type: "cafe", primaryColor: "#78350f", bio: "نخبة حبوب البن المحمصة بعناية لعشاق القهوة المختصة" },
  { name: "رياضة ونشاط", nameEn: "Sport & Activity", type: "sports", primaryColor: "#ef4444", bio: "كل ما تحتاجه للتمارين الرياضية واللياقة البدنية" },
  { name: "عطور العود", nameEn: "Oud Perfumes", type: "perfumes", primaryColor: "#d97706", bio: "عطور شرقية وغربية فاخرة تدوم طويلاً" },
  { name: "عالم الألعاب", nameEn: "Gamers World", type: "gaming", primaryColor: "#8b5cf6", bio: "محطتك المتكاملة لأحدث أجهزة ومنتجات ألعاب الفيديو" },
  { name: "مجوهرات الذهب", nameEn: "Gold Jewelry", type: "jewelry", primaryColor: "#eab308", bio: "تصاميم ذهبية وفضية نادرة ومجوهرات لكل المناسبات" },
  { name: "بيت الأثاث", nameEn: "Furniture Home", type: "furniture", primaryColor: "#854d0e", bio: "أثاث عصري وديكورات مذهلة تضفي لمسة جمالية لمنزلك" },
  { name: "كتب ومعرفة", nameEn: "Books & Knowledge", type: "books", primaryColor: "#06b6d4", bio: "روايات وكتب علمية وثقافية لتنمية فكرك ومعرفتك" },
  { name: "عالم الأطفال", nameEn: "Kids World", type: "kids", primaryColor: "#ec4899", bio: "ألعاب تعليمية وترفيهية آمنة ومسلية لطفلك" },
  { name: "تجميل وأناقة", nameEn: "Beauty & Elegance", type: "beauty", primaryColor: "#f43f5e", bio: "مستحضرات تجميل وعناية بالبشرة أصلية 100%" },
  { name: "بيت الشوكولاتة", nameEn: "Choco Palace", type: "chocolate", primaryColor: "#b45309", bio: "شوكولاتة بلجيكية وسويسرية فاخرة بنكهات غنية" },
  { name: "أوتو كير", nameEn: "Auto Care Accessories", type: "automotive", primaryColor: "#475569", bio: "إكسسوارات ومستلزمات العناية بالسيارات والقيادة الآمنة" },
  { name: "أزهار الربيع", nameEn: "Spring Flowers", type: "flowers", primaryColor: "#14b8a6", bio: "باقات ورد طبيعية وهدايا منسقة بكل حب واحترافية" },
  { name: "عالم الحيوانات", nameEn: "Pets World", type: "pets", primaryColor: "#84cc16", bio: "أغذية ومستلزمات صحية وترفيهية لحيوانك الأليف" },
  { name: "مخبوزات الفرن", nameEn: "Fresh Bakery", type: "bakery", primaryColor: "#ca8a04", bio: "مخبوزات وحلويات طازجة يومياً من الفرن مباشرة" },
  { name: "نظارات العيون", nameEn: "Optics World", type: "optics", primaryColor: "#0f172a", bio: "نظارات طبية وشمسية لأشهر الماركات العالمية" },
  { name: "ألعاب الفيديو", nameEn: "Video Games Zone", type: "videogames", primaryColor: "#4f46e5", bio: "أجهزة الكونسول والألعاب الرقمية والبطاقات المشحونة" }
];

const CATEGORIES_BY_TYPE: Record<string, Array<{ name: string, nameAr: string, slug: string, icon: string }>> = {
  fashion: [
    { name: "Men Clothing", nameAr: "ملابس رجالية", slug: "men", icon: "👕" },
    { name: "Women Clothing", nameAr: "ملابس نسائية", slug: "women", icon: "👗" },
    { name: "Shoes & Bags", nameAr: "أحذية وحقائب", slug: "shoes-bags", icon: "👜" }
  ],
  electronics: [
    { name: "Smartphones", nameAr: "هواتف ذكية", slug: "phones", icon: "📱" },
    { name: "Laptops & PCs", nameAr: "أجهزة كمبيوتر", slug: "laptops", icon: "💻" },
    { name: "Audio Devices", nameAr: "أجهزة الصوت", slug: "audio", icon: "🎧" }
  ],
  pharmacy: [
    { name: "Medicines", nameAr: "الأدوية", slug: "medicines", icon: "💊" },
    { name: "Skincare", nameAr: "العناية بالبشرة", slug: "skincare", icon: "🧴" },
    { name: "Vitamins", nameAr: "الفيتامينات", slug: "vitamins", icon: "🍏" }
  ],
  supermarket: [
    { name: "Fresh Food", nameAr: "أغذية طازجة", slug: "fresh-food", icon: "🍎" },
    { name: "Beverages", nameAr: "المشروبات", slug: "beverages", icon: "🥤" },
    { name: "Snacks", nameAr: "السناكس والحلويات", slug: "snacks", icon: "🍪" }
  ],
  cafe: [
    { name: "Coffee Beans", nameAr: "حبوب البن", slug: "coffee-beans", icon: "☕" },
    { name: "Brewing Tools", nameAr: "أدوات التقطير", slug: "tools", icon: "🧪" },
    { name: "Cups & Mugs", nameAr: "أكواب فاخرة", slug: "cups", icon: "🥛" }
  ]
};

const BRANDS_BY_TYPE: Record<string, Array<{ name: string, nameAr: string, slug: string }>> = {
  fashion: [
    { name: "Zara", nameAr: "زارا", slug: "zara" },
    { name: "H&M", nameAr: "اتش آند ام", slug: "hm" },
    { name: "Nike", nameAr: "نايك", slug: "nike" }
  ],
  electronics: [
    { name: "Apple", nameAr: "أبل", slug: "apple" },
    { name: "Samsung", nameAr: "سامسونج", slug: "samsung" },
    { name: "Sony", nameAr: "سوني", slug: "sony" }
  ],
  pharmacy: [
    { name: "Nivea", nameAr: "نيفيا", slug: "nivea" },
    { name: "Vichy", nameAr: "فيشي", slug: "vichy" },
    { name: "Bioderma", nameAr: "بيوديرما", slug: "bioderma" }
  ],
  supermarket: [
    { name: "Nestle", nameAr: "نستله", slug: "nestle" },
    { name: "Almarai", nameAr: "المراعي", slug: "almarai" },
    { name: "Danone", nameAr: "دانون", slug: "danone" }
  ],
  cafe: [
    { name: "Starbucks", nameAr: "ستارباكس", slug: "starbucks" },
    { name: "Illy", nameAr: "إيلي", slug: "illy" },
    { name: "Lavazza", nameAr: "لافازا", slug: "lavazza" }
  ]
};

const PRODUCTS_BY_TYPE: Record<string, Array<{ name: string, nameAr: string, basePrice: number, desc: string, descAr: string, tags: string[] }>> = {
  fashion: [
    { name: "Cotton Slim Shirt", nameAr: "قميص قطني ضيق", basePrice: 45, desc: "Premium quality 100% cotton shirt", descAr: "قميص قطني فاخر 100% بتصميم عصري ملائم", tags: ["shirt", "cotton", "fashion"] },
    { name: "Casual Denim Jacket", nameAr: "جاكيت جينز كاجوال", basePrice: 89, desc: "Stylish denim jacket for all seasons", descAr: "جاكيت جينز أنيق ومقاوم ومناسب لجميع فصول السنة", tags: ["jacket", "denim", "outerwear"] },
    { name: "Sport Run Sneakers", nameAr: "حذاء جري رياضي", basePrice: 120, desc: "Lightweight and breathable running sneakers", descAr: "حذاء جري خفيف الوزن ومرن ذو نعل ممتص للصدمات", tags: ["shoes", "sneakers", "sports"] },
    { name: "Classic Leather Belt", nameAr: "حزام جلدي كلاسيكي", basePrice: 25, desc: "Genuine leather belt with classic buckle", descAr: "حزام مصنوع من الجلد الطبيعي المتين مع مشبك أنيق", tags: ["belt", "leather", "accessories"] },
    { name: "Warm Wool Scarf", nameAr: "وشاح صوف دافئ", basePrice: 19, desc: "Soft wool scarf for winter", descAr: "وشاح صوف ناعم يمنح الدفء والأناقة في الشتاء", tags: ["scarf", "wool", "winter"] }
  ],
  electronics: [
    { name: "Smart Phone Pro", nameAr: "هاتف ذكي برو", basePrice: 899, desc: "Flagship phone with 120Hz display and triple camera", descAr: "هاتف رائد بشاشة 120 هرتز مع كاميرا ثلاثية فائقة الدقة", tags: ["phone", "smartphone", "pro"] },
    { name: "Ultrabook Air", nameAr: "ألترابوك إير", basePrice: 1299, desc: "Super thin laptop with long battery life", descAr: "كمبيوتر محمول نحيف وخفيف للغاية مع بطارية تدوم طويلاً", tags: ["laptop", "ultrabook", "computer"] },
    { name: "Noise Cancelling Headphones", nameAr: "سماعات عازلة للضوضاء", basePrice: 199, desc: "Wireless over-ear headphones with active ANC", descAr: "سماعات رأس لاسلكية مريحة مع ميزة إلغاء الضوضاء الفعالة", tags: ["audio", "headphones", "anc"] },
    { name: "Bluetooth Smartwatch", nameAr: "ساعة ذكية بلوتوث", basePrice: 149, desc: "Waterproof fitness tracker with heart rate monitor", descAr: "ساعة للياقة البدنية مقاومة للماء مع حساس نبضات القلب", tags: ["watch", "smartwatch", "fitness"] },
    { name: "Portable Powerbank 20k", nameAr: "شاحن متنقل 20 ألف أمبير", basePrice: 39, desc: "Fast charging powerbank for multiple devices", descAr: "شاحن متنقل عالي السعة يشحن الأجهزة الذكية بسرعة وبأمان", tags: ["powerbank", "charger", "accessories"] }
  ],
  pharmacy: [
    { name: "Multi-Vitamin Supplement", nameAr: "مكمل فيتامينات متعددة", basePrice: 29, desc: "Daily vitamins booster for health support", descAr: "كبسولات فيتامينات يومية لدعم مناعة ونشاط الجسم", tags: ["vitamins", "supplement", "health"] },
    { name: "Hydrating Moisturizer Cream", nameAr: "كريم ترطيب مكثف", basePrice: 24, desc: "Dry skin repair moisturizing lotion", descAr: "لوشن مرطب يومي مكثف للبشرة الجافة والحساسة", tags: ["cream", "skincare", "moisturizer"] },
    { name: "First Aid Kit Box", nameAr: "حقيبة إسعافات أولية", basePrice: 18, desc: "Emergency essential medical tools", descAr: "حقيبة طبية متكاملة لجميع حالات الطوارئ والإسعاف المنزلي", tags: ["medical", "firstaid", "emergency"] },
    { name: "Instant Hand Sanitizer", nameAr: "معقم يدين فوري", basePrice: 5, desc: "Kills 99.9% of germs, travel friendly", descAr: "جل معقم يقضي على الجراثيم والميكروبات فورياً دون ماء", tags: ["sanitizer", "hygiene", "travel"] },
    { name: "Digital Thermometer", nameAr: "ميزان حرارة رقمي", basePrice: 12, desc: "Fast and precise body temperature reading", descAr: "مقياس حرارة رقمي سريع ودقيق ومناسب للأطفال والكبار", tags: ["thermometer", "devices", "health"] }
  ],
  supermarket: [
    { name: "Organic Honey Jar", nameAr: "مرطبان عسل عضوي", basePrice: 15, desc: "Pure raw flower honey", descAr: "عسل نحل طبيعي وعضوي 100% مستخلص من زهور طبيعية", tags: ["honey", "organic", "food"] },
    { name: "Premium Green Tea", nameAr: "شاي أخضر بريميوم", basePrice: 8, desc: "Natural loose leaf green tea", descAr: "أوراق شاي أخضر طبيعية وغنية بمضادات الأكسدة لعشاق الشاي", tags: ["tea", "beverage", "green-tea"] },
    { name: "Oatmeal Cookies Pack", nameAr: "بسكويت الشوفان الصحي", basePrice: 6, desc: "Healthy snacks biscuits made of whole oats", descAr: "بسكويت الشوفان المقرمش واللذيذ والمناسب لمتبعي الحميات", tags: ["cookies", "snacks", "healthy"] },
    { name: "Extra Virgin Olive Oil", nameAr: "زيت زيتون بكر ممتاز", basePrice: 22, desc: "Cold pressed premium olive oil", descAr: "زيت زيتون معصور على البارد يحافظ على النكهة والقيمة الغذائية", tags: ["olive-oil", "cooking", "food"] },
    { name: "Crispy Potato Chips", nameAr: "رقائق بطاطس مقرمشة", basePrice: 3, desc: "Classic salted potato chips pack", descAr: "شيبس بطاطس مقرمش ومملح كلاسيكي ومحبوب لدى الأطفال", tags: ["chips", "snacks", "salty"] }
  ],
  cafe: [
    { name: "Ethiopian Coffee Beans 250g", nameAr: "بن إثيوبي 250 جرام", basePrice: 18, desc: "Light roast fruity arabica coffee beans", descAr: "حبوب بن إثيوبية مختصة ذات إيحاءات فاكهية وقوام خفيف", tags: ["coffee", "beans", "ethiopian"] },
    { name: "V60 Coffee Dripper", nameAr: "قمع تنقيط V60", basePrice: 14, desc: "Ceramic coffee brewer dripper tool", descAr: "قمع سيراميك لتقطير القهوة بفلتر ورقي لضمان صفاء الكوب", tags: ["dripper", "tools", "v60"] },
    { name: "Double Walled Glass Mug", nameAr: "كوب زجاجي مزدوج الجدار", basePrice: 12, desc: "Heat resistant glass mug for hot drinks", descAr: "كوب زجاجي مقاوم للحرارة يحافظ على برودة أو سخونة المشروب", tags: ["mug", "glass", "accessories"] },
    { name: "French Press Maker", nameAr: "صانع القهوة فرينش بريس", basePrice: 29, desc: "Classic glass coffee and tea plunger press", descAr: "وعاء كلاسيكي لتحضير القهوة السوداء والشاي بالكبس والتصفية", tags: ["frenchpress", "maker", "tools"] },
    { name: "Manual Coffee Grinder", nameAr: "مطحنة بن يدوية", basePrice: 35, desc: "Ceramic burr adjustable manual grinder", descAr: "مطحنة يدوية بتروس سيراميك قابلة للتعديل للحصول على طحن متناسق", tags: ["grinder", "manual", "tools"] }
  ]
};

async function seedData() {
  try {
    console.log("🚀 Connect to database...");
    await connectToDatabase();

    console.log("🧹 Cleaning old records of 20 seeded tenants...");
    // We will clear seeded tenants with emails pattern "seeded_*" to prevent clearing user manual data
    const existingSeededTenants = await Tenant.find({ email: { $regex: /^seeded_/ } });
    const tenantIds = existingSeededTenants.map(t => t._id);
    
    if (tenantIds.length > 0) {
      await Promise.all([
        Tenant.deleteMany({ _id: { $in: tenantIds } }),
        Store.deleteMany({ tenantId: { $in: tenantIds } }),
        Category.deleteMany({ tenantId: { $in: tenantIds } }),
        Product.deleteMany({ tenantId: { $in: tenantIds } }),
        Brand.deleteMany({ tenantId: { $in: tenantIds } }),
        User.deleteMany({ tenantId: { $in: tenantIds } }),
        Order.deleteMany({ tenantId: { $in: tenantIds } })
      ]);
      console.log(`✅ Cleaned up ${tenantIds.length} existing seeded stores data.`);
    }

    console.log("🌱 Seeding 20 Tenants and Stores...");
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const customerPassword = await bcrypt.hash("customer123", 10);

    for (let i = 0; i < 20; i++) {
      const template = STORE_TEMPLATES[i];
      const typeKey = ["fashion", "electronics", "pharmacy", "supermarket", "cafe"][i % 5];
      
      const tenantEmail = `seeded_admin_${i + 1}@lumura.com`;
      const storeSlug = `seeded-store-${i + 1}`;

      // 1. Create Tenant
      const tenant = await Tenant.create({
        slug: `${storeSlug}-tenant`,
        name: `المدير ${template.nameEn}`,
        email: tenantEmail,
        password: hashedPassword,
        role: "tenant_admin",
        plan: "YEARLY",
        status: "ACTIVE",
        isActive: true,
        subscriptionStart: new Date(),
        subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        maxStores: 3,
        maxProducts: 200,
        maxStaff: 5,
      });

      // 2. Create Store
      const store = await Store.create({
        tenantId: tenant._id,
        slug: storeSlug,
        name: template.name,
        nameEn: template.nameEn,
        description: template.bio,
        descriptionEn: `Online storefront for ${template.nameEn}`,
        shortBio: template.bio,
        shortBioEn: `Best products in ${template.nameEn}`,
        email: `contact@${storeSlug}.com`,
        phone: `012345678${i}`,
        address: "القاهرة، مصر",
        isActive: true,
        settings: {
          currency: ["EGP", "SAR", "AED"][i % 3],
          language: "ar",
          timezone: "Africa/Cairo",
          dateFormat: "DD/MM/YYYY",
          theme: { primaryColor: template.primaryColor, secondaryColor: "#1e293b" },
        },
        statistics: { totalProducts: 0, totalOrders: 0, totalRevenue: 0, totalCustomers: 0 },
      });

      // 3. Create Brands
      const brandTemplates = BRANDS_BY_TYPE[typeKey] || BRANDS_BY_TYPE.fashion;
      const brandDocs = [];
      for (let bIndex = 0; bIndex < brandTemplates.length; bIndex++) {
        const brandTemp = brandTemplates[bIndex];
        const brand = await Brand.create({
          tenantId: tenant._id,
          storeId: store._id,
          name: brandTemp.name,
          nameAr: brandTemp.nameAr,
          slug: `${brandTemp.slug}-${i + 1}`,
          logo: `https://picsum.photos/100/100?random=brand-${i}-${bIndex}`,
          isActive: true,
          isFeatured: bIndex === 0,
          sortOrder: bIndex,
        });
        brandDocs.push(brand);
      }

      // 4. Create Categories
      const catTemplates = CATEGORIES_BY_TYPE[typeKey] || CATEGORIES_BY_TYPE.fashion;
      const catDocs = [];
      for (let cIndex = 0; cIndex < catTemplates.length; cIndex++) {
        const catTemp = catTemplates[cIndex];
        const category = await Category.create({
          tenantId: tenant._id,
          storeId: store._id,
          name: catTemp.name,
          nameAr: catTemp.nameAr,
          slug: `${catTemp.slug}-${i + 1}`,
          description: `All about ${catTemp.name}`,
          descriptionAr: `أحدث منتجات قسم ${catTemp.nameAr}`,
          icon: catTemp.icon,
          image: `https://picsum.photos/400/400?random=cat-${i}-${cIndex}`,
          isActive: true,
          isFeatured: true,
          sortOrder: cIndex,
          subcategories: [
            { name: "Premium Sub", nameAr: "مميز فرعي", slug: `sub-${cIndex}-${i}`, isActive: true, sortOrder: 0 }
          ]
        });
        catDocs.push(category);
      }

      // 5. Create Products (10 products per store)
      const productTemplates = PRODUCTS_BY_TYPE[typeKey] || PRODUCTS_BY_TYPE.fashion;
      const productDocs = [];
      for (let pIndex = 0; pIndex < 10; pIndex++) {
        const pTemp = productTemplates[pIndex % productTemplates.length];
        
        // Dynamic price variation per store
        const price = Math.round(pTemp.basePrice * (1 + (i % 5) * 0.1));
        
        // 40% of products will have discount prices
        const hasDiscount = pIndex % 3 === 0;
        const discountPrice = hasDiscount ? Math.round(price * 0.8) : undefined;
        const discountPercent = hasDiscount ? 20 : undefined;

        const pName = `${pTemp.name} - M${pIndex + 1}`;
        const pNameAr = `${pTemp.nameAr} - إصدار ${pIndex + 1}`;
        const pSlug = `${pTemp.name.toLowerCase().replace(/\s+/g, "-")}-${i + 1}-${pIndex + 1}`;

        const product = await Product.create({
          tenantId: tenant._id,
          storeId: store._id,
          name: pName,
          nameAr: pNameAr,
          slug: pSlug,
          description: pTemp.desc,
          descriptionAr: pTemp.descAr,
          shortDescription: pTemp.desc.substring(0, 100),
          sku: `${typeKey.substring(0,3).toUpperCase()}${i + 1}P${pIndex + 1}`,
          category: catDocs[pIndex % catDocs.length]._id,
          subcategoryId: catDocs[pIndex % catDocs.length].subcategories[0]._id,
          subcategoryName: "Premium Sub",
          brand: brandDocs[pIndex % brandDocs.length]._id,
          purchasePrice: Math.round(price * 0.6),
          wholesalePrice: Math.round(price * 0.7),
          sellingPrice: price,
          discountPrice: discountPrice,
          discountPercent: discountPercent,
          profitMargin: 40,
          stockQuantity: 50 + (pIndex * 10),
          soldQuantity: 5 + pIndex,
          remainingQuantity: 45 + (pIndex * 10),
          lowStockThreshold: 5,
          unitType: "piece",
          isFeatured: pIndex % 2 === 0,
          isActive: true,
          isDeleted: false,
          images: [
            {
              url: `https://picsum.photos/500/500?random=prod-${i}-${pIndex}`,
              publicId: `seeded-prod-${i}-${pIndex}`,
              isPrimary: true
            }
          ],
          thumbnail: `https://picsum.photos/200/200?random=prod-thumb-${i}-${pIndex}`,
          tags: pTemp.tags,
          specifications: [
            { key: "Origin", value: "Imported" },
            { key: "Quality", value: "A+" }
          ]
        });
        productDocs.push(product);
      }

      // 6. Create Customers (3 per store)
      const customerDocs = [];
      for (let cIndex = 0; cIndex < 3; cIndex++) {
        const customer = await User.create({
          name: `عميل ${template.nameEn} ${cIndex + 1}`,
          email: `seeded_customer_${i + 1}_${cIndex + 1}@lumura.com`,
          password: customerPassword,
          phone: `010876543${i}${cIndex}`,
          role: "customer",
          tenantId: tenant._id,
          storeId: store._id,
          isActive: true,
          addresses: [{
            fullName: `عميل ${template.nameEn} ${cIndex + 1}`,
            phone: `010876543${i}${cIndex}`,
            street: "شارع التحرير، وسط البلد",
            city: "القاهرة",
            state: "القاهرة",
            country: "مصر",
            zipCode: "11511",
            isDefault: true,
          }]
        });
        customerDocs.push(customer);
      }

      // 7. Create Orders (3 per store)
      const orderStatuses = ["pending", "confirmed", "processing", "shipped", "delivered"];
      let totalRevenue = 0;

      for (let oIndex = 0; oIndex < 3; oIndex++) {
        const customer = customerDocs[oIndex % customerDocs.length];
        const ordProducts = [productDocs[oIndex % productDocs.length], productDocs[(oIndex + 1) % productDocs.length]];
        
        const items = ordProducts.map(p => {
          const itemPrice = p.discountPrice || p.sellingPrice;
          const qty = 1;
          const subtotal = itemPrice * qty;
          return {
            productId: p._id,
            name: p.name,
            slug: p.slug,
            image: p.images?.[0]?.url || "",
            sku: p.sku,
            price: itemPrice,
            quantity: qty,
            subtotal: subtotal
          };
        });

        const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
        const tax = Math.round(subtotal * 0.14);
        const shipping = 40;
        const total = subtotal + tax + shipping;
        totalRevenue += total;

        await Order.create({
          orderNumber: `LMR-${Date.now()}-${i + 1}-${oIndex + 1}`,
          userId: customer._id,
          storeId: store._id,
          tenantId: tenant._id,
          items: items,
          shippingAddress: customer.addresses[0],
          subtotal: subtotal,
          tax: tax,
          shipping: shipping,
          discount: 0,
          total: total,
          status: orderStatuses[oIndex % orderStatuses.length],
          paymentStatus: oIndex % 2 === 0 ? "paid" : "pending",
          paymentMethod: oIndex % 2 === 0 ? "stripe" : "cash_on_delivery",
          createdAt: new Date(Date.now() - (oIndex * 2 * 24 * 60 * 60 * 1000)),
        });
      }

      // 8. Update Store Statistics
      await Store.findByIdAndUpdate(store._id, {
        "statistics.totalProducts": productDocs.length,
        "statistics.totalOrders": 3,
        "statistics.totalRevenue": totalRevenue,
        "statistics.totalCustomers": customerDocs.length,
      });

      console.log(`   ✓ Store [${template.nameEn}] initialized with categories, products, and statistics.`);
    }

    console.log("\n=======================================================");
    console.log("🎉 Seeding completed successfully!");
    console.log("🌱 20 Tenants, 20 Stores, and hundreds of sub-assets generated.");
    console.log("=======================================================");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed with error:", error);
    process.exit(1);
  }
}

seedData();
