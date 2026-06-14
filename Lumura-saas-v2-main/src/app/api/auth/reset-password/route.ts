import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db/mongodb";
import Tenant from "@/models/Tenant";
import { verifyPasswordResetCode } from "@/lib/email/email.service";
import { z } from "zod";

const resetBodySchema = z
  .object({
    email: z.string().email().toLowerCase().trim(),
    code: z.string().length(6, "رمز غير صالح"),
    password: z
      .string()
      .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
      .regex(/[A-Z]/, "يجب أن تحتوي على حرف كبير")
      .regex(/[a-z]/, "يجب أن تحتوي على حرف صغير")
      .regex(/\d/, "يجب أن تحتوي على رقم"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = resetBodySchema.safeParse(body);

    if (!parsed.success) {
      const first = parsed.error.errors[0]?.message ?? "بيانات غير صالحة";
      return NextResponse.json({ error: first }, { status: 400 });
    }

    const { email, code, password } = parsed.data;

    const valid = await verifyPasswordResetCode(email, code);
    if (!valid) {
      return NextResponse.json(
        { error: "رمز غير صحيح أو منتهي الصلاحية" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const tenant = await Tenant.findOne({ email }).select("+password");
    if (!tenant) {
      return NextResponse.json({ error: "الحساب غير موجود" }, { status: 404 });
    }

    tenant.password = await bcrypt.hash(password, 12);
    await tenant.save();

    return NextResponse.json({
      success: true,
      message: "تم تغيير كلمة المرور بنجاح",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إعادة تعيين كلمة المرور" },
      { status: 500 }
    );
  }
}
