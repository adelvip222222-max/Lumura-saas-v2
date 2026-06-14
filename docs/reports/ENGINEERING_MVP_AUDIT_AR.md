# تقرير الفحص الهندسي وتحسينات MVP — Lumura SaaS Multi‑Tenant Ecommerce

تاريخ التنفيذ: 14 يونيو 2026

## 1) ملخص تنفيذي

المشروع مبني كمنصة SaaS متعددة المستأجرين Multi‑Tenant لمتاجر إلكترونية متعددة، وفيه أساس جيد يسمح بأن يمتلك المستأجر أكثر من متجر، مع اشتراك مستقل لكل متجر، ولوحة تحكم، ومنظومة منتجات/طلبات/تصنيفات/ماركات/عملاء/اشتراكات.

الفحص كشف أن المشروع قريب من MVP وظيفي، لكنه لم يكن جاهزًا كـ production MVP قبل التعديل بسبب مشاكل في واجهة المتجر، ضيق نظام الثيمات، وتعطل محتمل في صفحة الهوم بسبب تكرار مكوّن الهيرو، مع بعض مشاكل جودة TypeScript وبيئة build.

تم تنفيذ Patch عملي داخل الكود يضيف نظام تصميم متجر أوسع، ويصلح مشاكل مؤثرة في واجهة المتجر والاشتراكات.

## 2) ما تم فحصه

- بنية Next.js App Router.
- موديلات MongoDB/Mongoose: Tenant, Store, Plan, Subscription, Product, Order, Customer, Staff/User.
- صفحات المتجر العامة.
- صفحات لوحة تحكم المتجر.
- إعدادات الثيم والهوية البصرية.
- منطق الاشتراك لكل متجر.
- منطق تعليق المتجر عند انتهاء أو إلغاء الاشتراك.
- إعدادات lint/type-check وملفات الإنتاج الأساسية.

## 3) نقاط القوة الحالية

- وجود موديلات SaaS أساسية: Tenant / Store / Plan / Subscription.
- الاشتراك مرتبط بـ `storeId`، وهذا يحقق شرط حساب الخطة لكل متجر على حدة.
- وجود `maxStores` داخل Tenant يسمح بتحديد عدد المتاجر حسب خطة المستأجر.
- وجود لوحة تحكم لكل متجر عبر `/dashboard/stores/[storeSlug]`.
- وجود موديلات التجارة الأساسية: Products, Categories, Brands, Orders, Customers, Cart, Wishlist.
- وجود نظام إعدادات للمتجر داخل `Store.settings` قابل للتوسع.
- وجود Stripe SDK ومسارات اشتراكات قابلة للإكمال.

## 4) أهم المشاكل التي تم اكتشافها

### مشاكل حرجة تم التعامل معها

1. صفحة الهوم العامة للمتجر كانت بها تكرار في `<StoreHomeHeroSlider` يسبب كسر JSX أو Build.
2. نظام الثيمات كان محدودًا جدًا، يغير ألوان فقط تقريبًا، ولا يتحكم في شكل المتجر فعليًا.
3. Store model لم يكن يحتوي على `isSuspended` رغم أن أجزاء أخرى من الكود تستخدمه في السوبر أدمن والاشتراكات.
4. import خاطئ في `src/lib/auth/guards.ts` كان يشير إلى `@/lib/auth/auth` بينما الموجود هو `@/lib/auth`.
5. أمر lint في Next.js 15 كان يستخدم `next lint`، وتم تعديله إلى `eslint .`.

### مشاكل لا تزال تحتاج جولة Production Hardening

1. `npm install` لم يكتمل داخل بيئة الفحص، لذلك لم يمكن تشغيل build كامل محليًا.
2. `npm run type-check` يظهر عددًا كبيرًا من الأخطاء بسبب عدم وجود dependencies/types داخل `node_modules`، إضافة إلى أخطاء TypeScript قديمة مثل missing exported types وimplicit any وunknown/null checks.
3. توجد `console.log/console.error` كثيرة في server actions/routes ويجب تحويلها إلى logger منظم قبل الإنتاج.
4. بعض صفحات المتجر العامة القديمة تحتاج نفس سياسة `isSuspended` بشكل شامل.
5. Stripe lifecycle يحتاج إكمال حالات: trialing, active, past_due, canceled, paused, grace period.
6. صلاحيات الموظفين تحتاج اختبار end-to-end للتأكد أن كل Role يرى لوحة التحكم المناسبة فقط.

## 5) التعديلات المنفذة في هذا الـ Patch

### 5.1 نظام ثيمات متقدم للمتجر

تم توسيع `src/config/store-themes.ts` ليشمل:

- `productGridStyle`: شكل شبكة المنتجات.
- `filtersPlacement`: مكان الفلاتر.
- `heroStyle`: شكل Hero Section.
- `iconStyle`: شكل الأيقونات.
- `fontFamily`: نوع الخط.
- `cornerRadius`: درجة استدارة العناصر.
- ألوان رئيسية وثانوية.

تمت إضافة 6 أشكال جاهزة:

- Modern / عصري
- Luxury / فاخر
- Vibrant / نابض
- Professional / احترافي
- Minimal / مينيمال
- Boutique / بوتيك

### 5.2 توسيع Store model

تم تحديث `src/models/Store.ts` لإضافة:

- `settings.themePreset`
- `settings.productGridStyle`
- `settings.filtersPlacement`
- `settings.heroStyle`
- `settings.iconStyle`
- `settings.fontFamily`
- `settings.cornerRadius`
- `isSuspended`
- `suspendedReason`

### 5.3 لوحة إعدادات شكل المتجر

تم تحديث `src/components/admin/store-settings-panel.tsx` بحيث يستطيع المستأجر من لوحة التحكم اختيار:

- شكل جاهز للمتجر.
- شكل Product Grid.
- مكان الفلاتر: أعلى المنتجات / جانبي / Drawer-style.
- شكل Hero Section.
- شكل الأيقونات.
- الخط.
- درجة استدارة الكروت والأزرار.
- الألوان الأساسية والثانوية.

### 5.4 إنشاء متجر جديد مع اختيار الشكل

تم تحديث صفحة إنشاء المتجر `src/app/dashboard/create/page.tsx` لتدعم اختيار التصميم أثناء إنشاء المتجر، وليس بعد الإنشاء فقط.

### 5.5 واجهة المتجر العامة

تم تحديث:

- `src/app/(store)/[storeSlug]/page.tsx`
- `src/app/(store)/[storeSlug]/products/page.tsx`
- `src/components/store/product-card.tsx`
- `src/components/store-front/store-theme-shell.tsx`
- `src/app/(store)/store-front.css`

الواجهة أصبحت تتغير حسب إعدادات المستأجر:

- الهيرو يتغير بين split / centered / editorial.
- كروت المنتجات تتغير بين classic / compact / editorial / masonry.
- صفحة المنتجات تغير الفلاتر حسب اختيار المستأجر.
- الأيقونات تتغير بين outline / solid / duotone.
- الفونت والألوان والاستدارة تطبق كـ CSS variables على مستوى المتجر.

### 5.6 الاشتراك وتعليق المتجر

تمت إضافة دعم `isSuspended` في Store model وتحديث منطق الاشتراكات بحيث:

- عند انتهاء الاشتراك يتم إيقاف المتجر وتعليقه.
- عند تجديد أو تعيين خطة فعالة يتم فك التعليق.
- عند الإلغاء الفوري يتم تعليق المتجر بسبب `subscription_canceled`.

## 6) الملفات الأساسية التي تم تعديلها

- `src/config/store-themes.ts`
- `src/lib/store/store-theme.ts`
- `src/components/store-front/store-theme-shell.tsx`
- `src/components/admin/theme-preset-selector.tsx`
- `src/components/admin/store-settings-panel.tsx`
- `src/components/store/product-card.tsx`
- `src/app/(store)/[storeSlug]/page.tsx`
- `src/app/(store)/[storeSlug]/products/page.tsx`
- `src/app/(store)/store-front.css`
- `src/app/dashboard/create/page.tsx`
- `src/app/dashboard/stores/[storeSlug]/settings/page.tsx`
- `src/actions/stores.ts`
- `src/models/Store.ts`
- `src/services/subscription.service.ts`
- `src/lib/store/store-actions.ts`
- `src/lib/store/store-metadata.ts`
- `src/lib/auth/guards.ts`
- `package.json`

## 7) حالة التحقق الفني

تم تشغيل فحص TypeScript، لكن النتيجة ليست خضراء بسبب أن `node_modules` غير مكتمل في بيئة الفحص، وتظهر أخطاء مثل missing module declarations لـ Next/React/Mongoose/Zod وغيرها. لا توجد أخطاء Syntax ظاهرة من نوع TS1005/TS1128 في الملفات المعدلة.

للتأكد النهائي على جهاز التطوير أو السيرفر:

```bash
npm install
npm run type-check
npm run lint
npm run build
```

## 8) خطة الإكمال إلى Production MVP

الأولوية المقترحة قبل النشر الفعلي:

1. تثبيت dependencies وتشغيل build كامل.
2. تنظيف أخطاء TypeScript القديمة.
3. إكمال lifecycle الخاص بـ Stripe webhook.
4. إضافة rate limiting وحماية upload.
5. اختبار صلاحيات الموظفين لكل لوحة تحكم.
6. إضافة seed data للخطط والثيمات.
7. إضافة smoke tests لمسارات: إنشاء مستأجر، إنشاء متجر، اختيار خطة، إنشاء منتج، طلب شراء، إيقاف اشتراك.
8. إعداد production env وMongo indexes وbackup strategy.

## 9) الخلاصة

تم تحويل نظام الثيمات من مجرد ألوان إلى نظام تصميم متجر فعلي قابل للاختيار من المستأجر، مع تعديل الواجهة العامة ولوحة الإعدادات ونموذج Store ومنطق الاشتراكات. المشروع أصبح أقرب بكثير إلى MVP، لكنه يحتاج جولة build/type-check وتنظيف أخطاء TypeScript قبل اعتباره production-ready بشكل نهائي.
