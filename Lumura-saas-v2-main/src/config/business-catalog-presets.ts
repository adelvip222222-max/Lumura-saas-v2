export type BusinessPresetId =
  | "electronics"
  | "fashion"
  | "beauty"
  | "grocery"
  | "home"
  | "sports";

export type BusinessSubcategoryPreset = {
  name: string;
  nameAr: string;
  slug: string;
};

export type BusinessCategoryPreset = {
  name: string;
  nameAr: string;
  slug: string;
  icon: string;
  description: string;
  descriptionAr: string;
  subcategories: BusinessSubcategoryPreset[];
};

export type BusinessBrandPreset = {
  name: string;
  nameAr?: string;
  slug: string;
};

export type BusinessCatalogPreset = {
  id: BusinessPresetId;
  labelAr: string;
  labelEn: string;
  descriptionAr: string;
  descriptionEn: string;
  categories: BusinessCategoryPreset[];
  brands: BusinessBrandPreset[];
};

function cat(
  slug: string,
  name: string,
  nameAr: string,
  icon: string,
  subs: [string, string, string][]
): BusinessCategoryPreset {
  return {
    slug,
    name,
    nameAr,
    icon,
    description: `Popular ${name.toLowerCase()} products and collections.`,
    descriptionAr: `منتجات وتشكيلات ${nameAr} الأكثر طلبًا.`,
    subcategories: subs.map(([subSlug, subName, subNameAr]) => ({
      slug: subSlug,
      name: subName,
      nameAr: subNameAr,
    })),
  };
}

export const BUSINESS_CATALOG_PRESETS: BusinessCatalogPreset[] = [
  {
    id: "electronics",
    labelAr: "إلكترونيات وموبايلات",
    labelEn: "Electronics & Mobile",
    descriptionAr: "مناسب لمتاجر الموبايلات، الكمبيوتر، الأجهزة الذكية والإكسسوارات.",
    descriptionEn: "For phones, computers, smart devices, and accessories stores.",
    categories: [
      cat("smartphones", "Smartphones", "الهواتف الذكية", "📱", [["android-phones", "Android Phones", "هواتف أندرويد"], ["ios-phones", "iOS Phones", "هواتف آيفون"], ["phone-accessories", "Phone Accessories", "إكسسوارات الهواتف"]]),
      cat("laptops", "Laptops", "اللابتوبات", "💻", [["business-laptops", "Business Laptops", "لابتوبات أعمال"], ["gaming-laptops", "Gaming Laptops", "لابتوبات ألعاب"], ["student-laptops", "Student Laptops", "لابتوبات للطلاب"]]),
      cat("tablets", "Tablets", "الأجهزة اللوحية", "📲", [["android-tablets", "Android Tablets", "تابلت أندرويد"], ["ipad", "iPad", "آيباد"], ["tablet-cases", "Tablet Cases", "جرابات تابلت"]]),
      cat("smart-watches", "Smart Watches", "الساعات الذكية", "⌚", [["fitness-watches", "Fitness Watches", "ساعات رياضية"], ["kids-watches", "Kids Watches", "ساعات أطفال"], ["watch-bands", "Watch Bands", "أحزمة ساعات"]]),
      cat("tv-audio", "TV & Audio", "التلفزيونات والصوتيات", "📺", [["smart-tv", "Smart TV", "شاشات ذكية"], ["speakers", "Speakers", "سماعات خارجية"], ["headphones", "Headphones", "سماعات رأس"]]),
      cat("gaming", "Gaming", "الألعاب", "🎮", [["consoles", "Consoles", "أجهزة ألعاب"], ["controllers", "Controllers", "أذرع تحكم"], ["gaming-accessories", "Gaming Accessories", "إكسسوارات ألعاب"]]),
      cat("computer-parts", "Computer Parts", "قطع الكمبيوتر", "🧩", [["processors", "Processors", "معالجات"], ["graphics-cards", "Graphics Cards", "كروت شاشة"], ["motherboards", "Motherboards", "لوحات أم"]]),
      cat("storage", "Storage", "وحدات التخزين", "💾", [["ssd", "SSD", "أقراص SSD"], ["hard-drives", "Hard Drives", "هاردات"], ["memory-cards", "Memory Cards", "كروت ذاكرة"]]),
      cat("cameras", "Cameras", "الكاميرات", "📷", [["security-cameras", "Security Cameras", "كاميرات مراقبة"], ["digital-cameras", "Digital Cameras", "كاميرات رقمية"], ["camera-accessories", "Camera Accessories", "إكسسوارات كاميرات"]]),
      cat("networking", "Networking", "الشبكات", "🌐", [["routers", "Routers", "راوتر"], ["switches", "Switches", "سويتشات"], ["network-cables", "Network Cables", "كابلات شبكة"]]),
      cat("printers", "Printers", "الطابعات", "🖨️", [["inkjet-printers", "Inkjet Printers", "طابعات حبر"], ["laser-printers", "Laser Printers", "طابعات ليزر"], ["printer-ink", "Printer Ink", "أحبار طابعات"]]),
      cat("chargers-cables", "Chargers & Cables", "الشواحن والكابلات", "🔌", [["fast-chargers", "Fast Chargers", "شواحن سريعة"], ["usb-cables", "USB Cables", "كابلات USB"], ["power-banks", "Power Banks", "باور بانك"]]),
      cat("smart-home", "Smart Home", "المنزل الذكي", "🏠", [["smart-lights", "Smart Lights", "إضاءة ذكية"], ["smart-plugs", "Smart Plugs", "فيش ذكية"], ["home-sensors", "Home Sensors", "حساسات منزلية"]]),
      cat("home-appliances", "Home Appliances", "الأجهزة المنزلية", "🧺", [["kitchen-appliances", "Kitchen Appliances", "أجهزة مطبخ"], ["personal-care-devices", "Personal Care Devices", "أجهزة عناية"], ["cleaning-devices", "Cleaning Devices", "أجهزة تنظيف"]]),
      cat("electronics-offers", "Electronics Offers", "عروض الإلكترونيات", "🔥", [["new-arrivals", "New Arrivals", "وصل حديثًا"], ["best-sellers", "Best Sellers", "الأكثر مبيعًا"], ["clearance", "Clearance", "تصفية"]]),
    ],
    brands: [
      { name: "Samsung", nameAr: "سامسونج", slug: "samsung" },
      { name: "Apple", nameAr: "آبل", slug: "apple" },
      { name: "Xiaomi", nameAr: "شاومي", slug: "xiaomi" },
      { name: "Huawei", nameAr: "هواوي", slug: "huawei" },
      { name: "Lenovo", nameAr: "لينوفو", slug: "lenovo" },
      { name: "Dell", nameAr: "ديل", slug: "dell" },
      { name: "HP", nameAr: "إتش بي", slug: "hp" },
      { name: "Asus", nameAr: "أسوس", slug: "asus" },
      { name: "Acer", nameAr: "أيسر", slug: "acer" },
      { name: "LG", nameAr: "إل جي", slug: "lg" },
      { name: "Sony", nameAr: "سوني", slug: "sony" },
      { name: "Canon", nameAr: "كانون", slug: "canon" },
      { name: "TP-Link", nameAr: "تي بي لينك", slug: "tp-link" },
      { name: "Anker", nameAr: "أنكر", slug: "anker" },
      { name: "Logitech", nameAr: "لوجيتك", slug: "logitech" },
    ],
  },
  {
    id: "fashion",
    labelAr: "ملابس وموضة",
    labelEn: "Fashion & Apparel",
    descriptionAr: "مناسب لمتاجر الملابس، الأحذية، الحقائب والإكسسوارات.",
    descriptionEn: "For clothes, shoes, bags, and fashion accessories stores.",
    categories: [
      cat("women-clothing", "Women Clothing", "ملابس نسائية", "👗", [["dresses", "Dresses", "فساتين"], ["blouses", "Blouses", "بلوزات"], ["women-sets", "Women Sets", "أطقم نسائية"]]),
      cat("men-clothing", "Men Clothing", "ملابس رجالية", "👔", [["shirts", "Shirts", "قمصان"], ["pants", "Pants", "بناطيل"], ["men-sets", "Men Sets", "أطقم رجالية"]]),
      cat("kids-clothing", "Kids Clothing", "ملابس أطفال", "🧒", [["boys", "Boys", "أولاد"], ["girls", "Girls", "بنات"], ["baby-clothes", "Baby Clothes", "بيبي"]]),
      cat("shoes", "Shoes", "الأحذية", "👟", [["sneakers", "Sneakers", "سنيكرز"], ["formal-shoes", "Formal Shoes", "أحذية رسمية"], ["sandals", "Sandals", "صنادل"]]),
      cat("bags", "Bags", "الحقائب", "👜", [["handbags", "Handbags", "شنط يد"], ["backpacks", "Backpacks", "حقائب ظهر"], ["travel-bags", "Travel Bags", "حقائب سفر"]]),
      cat("accessories", "Accessories", "الإكسسوارات", "💍", [["jewelry", "Jewelry", "مجوهرات"], ["belts", "Belts", "أحزمة"], ["sunglasses", "Sunglasses", "نظارات شمسية"]]),
      cat("sportswear", "Sportswear", "ملابس رياضية", "🏃", [["training", "Training", "تمارين"], ["yoga", "Yoga", "يوجا"], ["tracksuits", "Tracksuits", "تريننج"]]),
      cat("winter", "Winter Wear", "ملابس شتوية", "🧥", [["jackets", "Jackets", "جاكيتات"], ["hoodies", "Hoodies", "هوديز"], ["knitwear", "Knitwear", "تريكو"]]),
      cat("summer", "Summer Wear", "ملابس صيفية", "☀️", [["t-shirts", "T-Shirts", "تيشيرتات"], ["shorts", "Shorts", "شورتات"], ["linen", "Linen", "كتان"]]),
      cat("modest-fashion", "Modest Fashion", "موضة محتشمة", "🧕", [["abayas", "Abayas", "عبايات"], ["hijab", "Hijab", "حجاب"], ["long-dresses", "Long Dresses", "فساتين طويلة"]]),
      cat("underwear", "Underwear", "ملابس داخلية", "🧦", [["socks", "Socks", "جوارب"], ["basics", "Basics", "أساسيات"], ["sleepwear", "Sleepwear", "ملابس نوم"]]),
      cat("watches", "Watches", "ساعات", "⌚", [["men-watches", "Men Watches", "ساعات رجالي"], ["women-watches", "Women Watches", "ساعات حريمي"], ["watch-accessories", "Watch Accessories", "إكسسوارات ساعات"]]),
      cat("premium-fashion", "Premium Fashion", "موضة فاخرة", "✨", [["designer", "Designer", "مصممين"], ["limited-edition", "Limited Edition", "إصدار محدود"], ["occasion-wear", "Occasion Wear", "مناسبات"]]),
      cat("fashion-offers", "Fashion Offers", "عروض الموضة", "🔥", [["new-season", "New Season", "الموسم الجديد"], ["best-sellers", "Best Sellers", "الأكثر مبيعًا"], ["sale", "Sale", "تخفيضات"]]),
      cat("care-products", "Clothing Care", "العناية بالملابس", "🧺", [["laundry", "Laundry", "غسيل"], ["storage", "Storage", "تخزين"], ["shoe-care", "Shoe Care", "عناية بالأحذية"]]),
    ],
    brands: ["Nike", "Adidas", "Puma", "Zara", "H&M", "LC Waikiki", "Mango", "Defacto", "Reebok", "Levis", "Pull&Bear", "Bershka", "Converse", "Skechers", "Cottonil"].map((name) => ({ name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") })),
  },
  {
    id: "beauty",
    labelAr: "تجميل وعناية شخصية",
    labelEn: "Beauty & Personal Care",
    descriptionAr: "مناسب لمتاجر المكياج، العطور، العناية بالبشرة والشعر.",
    descriptionEn: "For makeup, perfumes, skincare, and haircare stores.",
    categories: [
      cat("makeup", "Makeup", "مكياج", "💄", [["face", "Face", "الوجه"], ["eyes", "Eyes", "العيون"], ["lips", "Lips", "الشفاه"]]),
      cat("skincare", "Skincare", "العناية بالبشرة", "🧴", [["cleansers", "Cleansers", "غسول"], ["moisturizers", "Moisturizers", "مرطبات"], ["serums", "Serums", "سيروم"]]),
      cat("haircare", "Haircare", "العناية بالشعر", "💇", [["shampoo", "Shampoo", "شامبو"], ["conditioner", "Conditioner", "بلسم"], ["hair-treatment", "Hair Treatment", "علاج الشعر"]]),
      cat("fragrance", "Fragrance", "العطور", "🌸", [["women-perfume", "Women Perfume", "عطور حريمي"], ["men-perfume", "Men Perfume", "عطور رجالي"], ["body-mist", "Body Mist", "بودي ميست"]]),
      cat("body-care", "Body Care", "العناية بالجسم", "🧼", [["body-lotion", "Body Lotion", "لوشن"], ["body-wash", "Body Wash", "غسول جسم"], ["scrubs", "Scrubs", "مقشرات"]]),
      cat("nail-care", "Nail Care", "العناية بالأظافر", "💅", [["nail-polish", "Nail Polish", "طلاء أظافر"], ["nail-tools", "Nail Tools", "أدوات أظافر"], ["nail-treatment", "Nail Treatment", "علاج أظافر"]]),
      cat("men-grooming", "Men Grooming", "عناية الرجال", "🪒", [["shaving", "Shaving", "حلاقة"], ["beard-care", "Beard Care", "عناية باللحية"], ["men-skincare", "Men Skincare", "بشرة الرجال"]]),
      cat("beauty-tools", "Beauty Tools", "أدوات التجميل", "🪞", [["brushes", "Brushes", "فرش"], ["sponges", "Sponges", "إسفنج"], ["mirrors", "Mirrors", "مرايات"]]),
      cat("sun-care", "Sun Care", "العناية من الشمس", "☀️", [["sunscreen", "Sunscreen", "واقي شمس"], ["after-sun", "After Sun", "بعد الشمس"], ["tanning", "Tanning", "تان"]]),
      cat("bath-body", "Bath & Body", "الاستحمام والجسم", "🛁", [["soap", "Soap", "صابون"], ["bath-salts", "Bath Salts", "أملاح"], ["loofah", "Loofah", "ليفة"]]),
      cat("oral-care", "Oral Care", "العناية بالفم", "🦷", [["toothpaste", "Toothpaste", "معجون"], ["toothbrush", "Toothbrush", "فرشاة"], ["mouthwash", "Mouthwash", "غسول فم"]]),
      cat("deodorants", "Deodorants", "مزيلات العرق", "🧊", [["roll-on", "Roll On", "رول أون"], ["spray", "Spray", "اسبراي"], ["natural-deodorant", "Natural", "طبيعي"]]),
      cat("gift-sets", "Gift Sets", "مجموعات هدايا", "🎁", [["perfume-sets", "Perfume Sets", "مجموعات عطور"], ["skincare-sets", "Skincare Sets", "مجموعات بشرة"], ["makeup-sets", "Makeup Sets", "مجموعات مكياج"]]),
      cat("clean-beauty", "Clean Beauty", "تجميل طبيعي", "🌿", [["organic", "Organic", "عضوي"], ["vegan", "Vegan", "نباتي"], ["sensitive-skin", "Sensitive Skin", "بشرة حساسة"]]),
      cat("beauty-offers", "Beauty Offers", "عروض التجميل", "🔥", [["new-arrivals", "New Arrivals", "وصل حديثًا"], ["best-sellers", "Best Sellers", "الأكثر مبيعًا"], ["discounts", "Discounts", "خصومات"]]),
    ],
    brands: ["Maybelline", "L'Oreal", "Garnier", "Nivea", "Dove", "Vichy", "La Roche-Posay", "The Ordinary", "CeraVe", "Bioderma", "Neutrogena", "Essence", "MAC", "Revlon", "Yves Rocher"].map((name) => ({ name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") })),
  },
  {
    id: "grocery",
    labelAr: "سوبر ماركت وبقالة",
    labelEn: "Grocery & Supermarket",
    descriptionAr: "مناسب لمتاجر البقالة، الأغذية، المشروبات واحتياجات المنزل اليومية.",
    descriptionEn: "For grocery, food, drinks, and daily household essentials.",
    categories: [
      cat("fresh-food", "Fresh Food", "أغذية طازجة", "🥬", [["vegetables", "Vegetables", "خضروات"], ["fruits", "Fruits", "فواكه"], ["herbs", "Herbs", "أعشاب"]]),
      cat("dairy-eggs", "Dairy & Eggs", "ألبان وبيض", "🥛", [["milk", "Milk", "لبن"], ["cheese", "Cheese", "جبن"], ["eggs", "Eggs", "بيض"]]),
      cat("bakery", "Bakery", "مخبوزات", "🥐", [["bread", "Bread", "عيش"], ["pastries", "Pastries", "معجنات"], ["cakes", "Cakes", "كيك"]]),
      cat("meat-poultry", "Meat & Poultry", "لحوم ودواجن", "🍗", [["beef", "Beef", "لحوم"], ["chicken", "Chicken", "دواجن"], ["processed-meat", "Processed Meat", "مصنعات"]]),
      cat("seafood", "Seafood", "أسماك ومأكولات بحرية", "🐟", [["fish", "Fish", "سمك"], ["shrimp", "Shrimp", "جمبري"], ["frozen-seafood", "Frozen Seafood", "مجمدات بحرية"]]),
      cat("frozen-food", "Frozen Food", "أطعمة مجمدة", "❄️", [["frozen-vegetables", "Frozen Vegetables", "خضار مجمد"], ["frozen-meals", "Frozen Meals", "وجبات مجمدة"], ["ice-cream", "Ice Cream", "آيس كريم"]]),
      cat("pantry", "Pantry", "أساسيات المطبخ", "🧂", [["rice-pasta", "Rice & Pasta", "أرز ومكرونة"], ["oil-ghee", "Oil & Ghee", "زيوت وسمن"], ["spices", "Spices", "توابل"]]),
      cat("snacks", "Snacks", "تسالي", "🍿", [["chips", "Chips", "شيبسي"], ["nuts", "Nuts", "مكسرات"], ["biscuits", "Biscuits", "بسكويت"]]),
      cat("beverages", "Beverages", "مشروبات", "🥤", [["water", "Water", "مياه"], ["juices", "Juices", "عصائر"], ["soft-drinks", "Soft Drinks", "مشروبات غازية"]]),
      cat("coffee-tea", "Coffee & Tea", "قهوة وشاي", "☕", [["coffee", "Coffee", "قهوة"], ["tea", "Tea", "شاي"], ["hot-chocolate", "Hot Chocolate", "كاكاو"]]),
      cat("baby-food", "Baby Food", "أغذية أطفال", "🍼", [["formula", "Formula", "لبن أطفال"], ["baby-snacks", "Baby Snacks", "سناكس أطفال"], ["purees", "Purees", "مهروس"]]),
      cat("household", "Household", "مستلزمات المنزل", "🧽", [["cleaners", "Cleaners", "منظفات"], ["paper-products", "Paper Products", "مناديل وورقيات"], ["laundry", "Laundry", "غسيل"]]),
      cat("personal-care", "Personal Care", "عناية شخصية", "🧴", [["soap", "Soap", "صابون"], ["shampoo", "Shampoo", "شامبو"], ["oral-care", "Oral Care", "عناية الفم"]]),
      cat("pet-food", "Pet Food", "أكل حيوانات أليفة", "🐾", [["cat-food", "Cat Food", "طعام قطط"], ["dog-food", "Dog Food", "طعام كلاب"], ["pet-treats", "Pet Treats", "مكافآت"]]),
      cat("grocery-offers", "Grocery Offers", "عروض السوبر ماركت", "🔥", [["daily-offers", "Daily Offers", "عروض يومية"], ["bundles", "Bundles", "باقات"], ["value-packs", "Value Packs", "عبوات اقتصادية"]]),
    ],
    brands: ["Nestle", "Pepsi", "Coca-Cola", "Juhayna", "Dina Farms", "Heinz", "Kellogg's", "Lipton", "Nescafe", "Danone", "Pampers", "Ariel", "Persil", "Dettol", "Fine"].map((name) => ({ name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") })),
  },
  {
    id: "home",
    labelAr: "منزل وديكور",
    labelEn: "Home & Decor",
    descriptionAr: "مناسب لمتاجر الأثاث، الديكور، الأدوات المنزلية والمفروشات.",
    descriptionEn: "For furniture, decor, household tools, and textile stores.",
    categories: [
      cat("furniture", "Furniture", "أثاث", "🛋️", [["sofas", "Sofas", "كنب"], ["tables", "Tables", "ترابيزات"], ["chairs", "Chairs", "كراسي"]]),
      cat("bedroom", "Bedroom", "غرف نوم", "🛏️", [["beds", "Beds", "أسرة"], ["wardrobes", "Wardrobes", "دواليب"], ["mattresses", "Mattresses", "مراتب"]]),
      cat("kitchen", "Kitchen", "المطبخ", "🍳", [["cookware", "Cookware", "أواني طهي"], ["dinnerware", "Dinnerware", "أطقم سفرة"], ["kitchen-storage", "Kitchen Storage", "تخزين مطبخ"]]),
      cat("bathroom", "Bathroom", "الحمام", "🚿", [["towels", "Towels", "فوط"], ["bath-accessories", "Bath Accessories", "إكسسوارات حمام"], ["organizers", "Organizers", "منظمات"]]),
      cat("home-decor", "Home Decor", "ديكور المنزل", "🖼️", [["wall-art", "Wall Art", "ديكور حائط"], ["vases", "Vases", "فازات"], ["candles", "Candles", "شموع"]]),
      cat("lighting", "Lighting", "إضاءة", "💡", [["ceiling-lights", "Ceiling Lights", "نجف"], ["table-lamps", "Table Lamps", "أباجورات"], ["led-strips", "LED Strips", "ليد"]]),
      cat("textiles", "Textiles", "مفروشات", "🧵", [["curtains", "Curtains", "ستائر"], ["rugs", "Rugs", "سجاد"], ["bedding", "Bedding", "ملايات"]]),
      cat("storage-organization", "Storage & Organization", "تخزين وتنظيم", "📦", [["boxes", "Boxes", "صناديق"], ["shelves", "Shelves", "أرفف"], ["closet-organizers", "Closet Organizers", "منظمات دولاب"]]),
      cat("garden", "Garden", "حديقة وبلكونة", "🪴", [["plants", "Plants", "نباتات"], ["outdoor-furniture", "Outdoor Furniture", "أثاث خارجي"], ["garden-tools", "Garden Tools", "أدوات حديقة"]]),
      cat("cleaning", "Cleaning", "تنظيف", "🧼", [["mops", "Mops", "مساحات"], ["brushes", "Brushes", "فرش"], ["cleaning-liquids", "Cleaning Liquids", "سوائل تنظيف"]]),
      cat("appliances", "Appliances", "أجهزة منزلية", "🔌", [["small-appliances", "Small Appliances", "أجهزة صغيرة"], ["fans", "Fans", "مراوح"], ["heaters", "Heaters", "دفايات"]]),
      cat("tools", "Tools", "عدد وأدوات", "🛠️", [["hand-tools", "Hand Tools", "عدد يدوية"], ["power-tools", "Power Tools", "عدد كهربائية"], ["hardware", "Hardware", "مستلزمات"]]),
      cat("kids-room", "Kids Room", "غرف أطفال", "🧸", [["kids-beds", "Kids Beds", "أسرة أطفال"], ["toys-storage", "Toys Storage", "تخزين ألعاب"], ["study-desks", "Study Desks", "مكاتب دراسة"]]),
      cat("smart-home", "Smart Home", "المنزل الذكي", "🏠", [["smart-lighting", "Smart Lighting", "إضاءة ذكية"], ["security", "Security", "أمان"], ["sensors", "Sensors", "حساسات"]]),
      cat("home-offers", "Home Offers", "عروض المنزل", "🔥", [["new-arrivals", "New Arrivals", "وصل حديثًا"], ["best-sellers", "Best Sellers", "الأكثر مبيعًا"], ["clearance", "Clearance", "تصفية"]]),
    ],
    brands: ["IKEA", "Home Centre", "Tornado", "Fresh", "Unionaire", "Black+Decker", "Tefal", "Pyrex", "Luminarc", "Kenwood", "Braun", "Philips", "Hoover", "Karcher", "Samsung"].map((name) => ({ name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") })),
  },
  {
    id: "sports",
    labelAr: "رياضة ولياقة",
    labelEn: "Sports & Fitness",
    descriptionAr: "مناسب لمتاجر الملابس الرياضية، أدوات التمارين والمكملات غير الدوائية.",
    descriptionEn: "For sportswear, exercise gear, and non-medical fitness accessories.",
    categories: [
      cat("fitness-equipment", "Fitness Equipment", "أجهزة رياضية", "🏋️", [["dumbbells", "Dumbbells", "دمبل"], ["treadmills", "Treadmills", "مشايات"], ["resistance-bands", "Resistance Bands", "أحبال مقاومة"]]),
      cat("sportswear", "Sportswear", "ملابس رياضية", "👕", [["men-sportswear", "Men Sportswear", "رجالي"], ["women-sportswear", "Women Sportswear", "حريمي"], ["kids-sportswear", "Kids Sportswear", "أطفال"]]),
      cat("sports-shoes", "Sports Shoes", "أحذية رياضية", "👟", [["running-shoes", "Running Shoes", "جري"], ["training-shoes", "Training Shoes", "تمرين"], ["football-shoes", "Football Shoes", "كرة قدم"]]),
      cat("football", "Football", "كرة القدم", "⚽", [["balls", "Balls", "كرات"], ["kits", "Kits", "أطقم"], ["goalkeeper", "Goalkeeper", "حارس مرمى"]]),
      cat("basketball", "Basketball", "كرة السلة", "🏀", [["basketballs", "Basketballs", "كرات سلة"], ["basketball-shoes", "Basketball Shoes", "أحذية سلة"], ["hoops", "Hoops", "سلات"]]),
      cat("swimming", "Swimming", "سباحة", "🏊", [["swimwear", "Swimwear", "ملابس سباحة"], ["goggles", "Goggles", "نظارات سباحة"], ["caps", "Caps", "قبعات"]]),
      cat("cycling", "Cycling", "دراجات", "🚴", [["bikes", "Bikes", "دراجات"], ["helmets", "Helmets", "خوذات"], ["bike-accessories", "Bike Accessories", "إكسسوارات"]]),
      cat("outdoor", "Outdoor", "أنشطة خارجية", "⛺", [["camping", "Camping", "تخييم"], ["hiking", "Hiking", "هايكنج"], ["outdoor-bags", "Outdoor Bags", "شنط"]]),
      cat("yoga-pilates", "Yoga & Pilates", "يوجا وبيلاتس", "🧘", [["mats", "Mats", "مات"], ["blocks", "Blocks", "بلوك"], ["stretching", "Stretching", "إطالة"]]),
      cat("racket-sports", "Racket Sports", "رياضات المضرب", "🎾", [["tennis", "Tennis", "تنس"], ["padel", "Padel", "بادل"], ["badminton", "Badminton", "ريشة"]]),
      cat("boxing", "Boxing", "ملاكمة", "🥊", [["gloves", "Gloves", "قفازات"], ["bags", "Bags", "أكياس"], ["protective-gear", "Protective Gear", "حماية"]]),
      cat("fitness-accessories", "Fitness Accessories", "إكسسوارات رياضية", "🎽", [["bottles", "Bottles", "زجاجات"], ["shakers", "Shakers", "شيكر"], ["gym-bags", "Gym Bags", "شنط جيم"]]),
      cat("team-sports", "Team Sports", "رياضات جماعية", "🏆", [["volleyball", "Volleyball", "طائرة"], ["handball", "Handball", "يد"], ["training-cones", "Training Cones", "أقماع تدريب"]]),
      cat("recovery", "Recovery", "استشفاء", "🧊", [["foam-rollers", "Foam Rollers", "فوم رولر"], ["massage-tools", "Massage Tools", "أدوات مساج"], ["supports", "Supports", "دعامات"]]),
      cat("sports-offers", "Sports Offers", "عروض الرياضة", "🔥", [["new-arrivals", "New Arrivals", "وصل حديثًا"], ["best-sellers", "Best Sellers", "الأكثر مبيعًا"], ["sale", "Sale", "تخفيضات"]]),
    ],
    brands: ["Nike", "Adidas", "Puma", "Reebok", "Under Armour", "Decathlon", "Wilson", "Spalding", "Speedo", "Asics", "New Balance", "Skechers", "Garmin", "Fitbit", "Kipsta"].map((name) => ({ name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") })),
  },
];

export const DEFAULT_BUSINESS_PRESET_ID: BusinessPresetId = "electronics";

export function getBusinessCatalogPreset(id?: string | null) {
  return (
    BUSINESS_CATALOG_PRESETS.find((preset) => preset.id === id) ??
    BUSINESS_CATALOG_PRESETS.find((preset) => preset.id === DEFAULT_BUSINESS_PRESET_ID)!
  );
}
