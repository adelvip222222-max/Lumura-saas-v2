// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import Tenant from "@/models/Tenant";
import bcrypt from "bcryptjs";
import { z } from "zod";

// ✅ Schema للتحقق من صحة البيانات
const registerSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  password: z
    .string()
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    .regex(/[A-Za-z]/, "كلمة المرور يجب أن تحتوي على حرف إنجليزي واحد على الأقل")
    .regex(/\d/, "كلمة المرور يجب أن تحتوي على رقم واحد على الأقل")
    .regex(/[^A-Za-z0-9]/, "كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل"),
  slug: z.string().min(2, "المعرف يجب أن يكون حرفين على الأقل")
    .regex(/^[a-z0-9-]+$/, "المعرف يجب أن يحتوي على أحرف إنجليزية وأرقام وشرطات فقط"),
  phone: z.string().optional(),
  plan: z.enum(['MONTHLY', 'SEMI_ANNUAL', 'YEARLY']).default('MONTHLY'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // ✅ التحقق من صحة البيانات
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0] || "بيانات غير صالحة";
      
      return NextResponse.json(
        { success: false, error: firstError, errors },
        { status: 400 }
      );
    }

    const { name, email, password, slug, phone, plan } = validation.data;

    await connectToDatabase();

    // ✅ التحقق من وجود slug مسبقاً
    const existingSlug = await Tenant.findOne({ slug: slug.toLowerCase() });
    if (existingSlug) {
      return NextResponse.json(
        { 
          success: false, 
          error: `المعرف "${slug}" مستخدم بالفعل. يرجى اختيار معرف آخر.`,
          field: 'slug'
        },
        { status: 409 } // Conflict
      );
    }

    // ✅ التحقق من وجود البريد الإلكتروني مسبقاً
    const existingEmail = await Tenant.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return NextResponse.json(
        { 
          success: false, 
          error: "البريد الإلكتروني مستخدم بالفعل. يرجى استخدام بريد آخر أو تسجيل الدخول.",
          field: 'email'
        },
        { status: 409 }
      );
    }

    // ✅ تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 12);

    // ✅ حساب تاريخ انتهاء الاشتراك
    const subscriptionEnd = new Date();
    switch (plan) {
      case 'MONTHLY':
        subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
        break;
      case 'SEMI_ANNUAL':
        subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 6);
        break;
      case 'YEARLY':
        subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);
        break;
    }

    // ✅ إنشاء المستأجر
    const tenant = await Tenant.create({
      slug: slug.toLowerCase(),
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      plan,
      role: 'tenant_admin',
      status: 'ACTIVE', // أو 'PENDING' حسب الحاجة
      subscriptionStart: new Date(),
      subscriptionEnd,
      isActive: true,
    });

    console.log("✅ Tenant registered:", { 
      id: tenant._id, 
      slug: tenant.slug, 
      email: tenant.email 
    });

    // ✅ إرجاع النجاح (بدون كلمة المرور)
    return NextResponse.json({
      success: true,
      message: "تم إنشاء الحساب بنجاح!",
      data: {
        id: tenant._id.toString(),
        slug: tenant.slug,
        name: tenant.name,
        email: tenant.email,
        plan: tenant.plan,
        status: tenant.status,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error("Registration error:", error);

    // ✅ التعامل مع خطأ التكرار (E11000)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];
      
      let message = "بيانات مكررة";
      if (field === 'slug') {
        message = `المعرف "${value}" مستخدم بالفعل. يرجى اختيار معرف آخر.`;
      } else if (field === 'email') {
        message = "البريد الإلكتروني مستخدم بالفعل.";
      }
      
      return NextResponse.json(
        { success: false, error: message, field },
        { status: 409 }
      );
    }

    // ✅ التعامل مع أخطاء التحقق من Mongoose
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e: any) => e.message);
      return NextResponse.json(
        { success: false, error: errors[0] || "بيانات غير صالحة" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى." },
      { status: 500 }
    );
  }
}
