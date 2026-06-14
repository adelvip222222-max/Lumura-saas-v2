# ملف بيئة Vercel الصحيح للمشروع

استخدم الملف `.env.vercel.example` كقائمة متغيرات، ولا ترفعه كملف أسرار حقيقي إلى GitHub. الأفضل إدخال القيم من:

Vercel Dashboard → Project → Settings → Environment Variables

## أهم القيم المطلوبة للنشر

1. `NEXT_PUBLIC_APP_URL` و `NEXTAUTH_URL`
   - ضع رابط Vercel النهائي مثل:
   - `https://your-project.vercel.app`

2. `NEXTAUTH_SECRET` و `AUTH_SECRET` و `JWT_SECRET`
   - استخدم نفس قيمة سرية قوية.
   - توليد قيمة قوية محليًا:

```bash
openssl rand -base64 32
```

3. `MONGODB_URI`
   - يجب أن يكون MongoDB Atlas وليس MongoDB localhost لأن Vercel لا يشغل قاعدة محلية.

4. Cloudinary
   - مطلوب لرفع صور المنتجات والشعار والبانرات.

5. Stripe و SMTP
   - يمكن ترك Stripe غير مفعل أثناء التجربة، لكن الدفع لن يعمل.
   - SMTP مطلوب لإرسال البريد الحقيقي، أو استخدم `EMAIL_DEV_MODE=true` مؤقتًا.
