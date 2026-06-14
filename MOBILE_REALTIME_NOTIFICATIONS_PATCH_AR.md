# تقرير تعديل واجهة الهاتف والإشعارات Real-Time

تاريخ التنفيذ: 14 يونيو 2026

## 1. فحص المشكلة من الصور

تم رصد أن لوحة تحكم المتجر على وضع الهاتف كانت تعرض الشريط الجانبي كاملًا داخل عرض iPhone SE تقريبًا، مما تسبب في ضغط محتوى الصفحة وظهور الإحصائيات والكروت بشكل غير لائق.

## 2. ما تم تعديله في واجهة الهاتف

- إلغاء ظهور الشريط الجانبي الثابت على شاشات الهاتف.
- إضافة شريط سفلي Mobile Bottom Navigation يحتوي فقط على القوائم المهمة:
  - لوحة التحكم
  - المنتجات
  - الطلبات
  - الإعدادات
  - المزيد
- إضافة زر عائم ظاهر دائمًا في وضع الهاتف لفتح القائمة الجانبية عند إغلاقها.
- إضافة Drawer جانبي يفتح ويغلق في الهاتف ويعرض جميع قوائم المتجر.
- إبقاء الشريط الجانبي الكامل على سطح المكتب فقط.
- توسيع مساحة المحتوى في الهاتف حتى لا يتم ضغط الكروت والإحصائيات.

## 3. ما تم تعديله في الإشعارات

- استبدال زر الجرس الوهمي في لوحة المتجر بمكون إشعارات حقيقي.
- إضافة الإشعارات إلى لوحة التحكم الرئيسية الخاصة بالمستأجر `/dashboard`.
- إضافة Route جديد للبث اللحظي عبر Server-Sent Events:
  - `/api/notifications/stream`
- إضافة fallback polling كل 15 ثانية إذا أغلق المتصفح أو Vercel اتصال SSE.
- إضافة تنبيه صوتي عند وصول إشعار جديد.
- إضافة Toast يظهر على الشاشة عند وصول إشعار جديد.
- إصلاح سبب عدم ظهور إشعارات المستأجر: كان `notifyTenantUsers` يبحث عن المستخدمين داخل Model `User` بينما حسابات المستأجر والموظفين في النظام موجودة داخل Model `Tenant`.

## 4. ما تم تعديله في منطق الإشعارات

- إشعار الطلب الجديد يصل الآن إلى المستأجر الرئيسي وموظف الطلبات.
- إشعارات تعديل حالة الطلب تصل إلى المستأجر الرئيسي وموظف الطلبات.
- إشعارات المنتجات تصل إلى المستأجر الرئيسي وموظف المنتجات.
- عند ضغط المستأجر على إشعار قادم من شاشة الإدارة المختصرة `/ad-i-*` يتم تحويله تلقائيًا إلى صفحة لوحة المتجر المناسبة مثل:
  - `/dashboard/stores/[storeSlug]/orders`
  - `/dashboard/stores/[storeSlug]/products`

## 5. ملفات مهمة أضيفت أو تم تعديلها

- `src/components/admin/store-dashboard-shell.tsx`
- `src/app/dashboard/stores/[storeSlug]/layout.tsx`
- `src/components/admin/admin-header.tsx`
- `src/components/ui/notifications-bell.tsx`
- `src/app/api/notifications/stream/route.ts`
- `src/actions/notifications.ts`
- `src/actions/orders.ts`
- `src/app/(administration)/ad-i-orders/action.ts`
- `src/app/(administration)/ad-i-products/action.ts`
- `src/app/dashboard/page.tsx`
- `src/config/site.ts`
- `.env.vercel.example`
- `VERCEL_ENV_GUIDE_AR.md`

## 6. ملاحظات مهمة قبل النشر

لم يتم تنفيذ build كامل داخل بيئة الفحص لأن `node_modules` غير موجودة في النسخة المضغوطة. عند تشغيل `npm run type-check` ظهرت أخطاء كثيرة مرتبطة بنقص الحزم والـ types مثل Next وReact وMongoose، لذلك الاختبار النهائي يجب أن يتم بعد:

```bash
npm install
npm run type-check
npm run lint
npm run build
```

## 7. ملاحظة Vercel مهمة

استخدام SSE على Vercel يعمل كتحسين Real-Time خفيف، لكن الاتصال قد يغلق تلقائيًا حسب بيئة Serverless. لذلك تم إضافة fallback polling كل 15 ثانية لضمان استمرار وصول الإشعارات حتى لو أُغلق stream.
