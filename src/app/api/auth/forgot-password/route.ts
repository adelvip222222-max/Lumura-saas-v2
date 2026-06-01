import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import Tenant from "@/models/Tenant";
import { sendPasswordResetCode } from "@/lib/email/email.service";
import { forgotPasswordSchema } from "@/schemas/auth";

const GENERIC_SUCCESS =
  "إذا كان البريد مسجّلاً لدينا، ستصلك رسالة تحتوي على رمز إعادة التعيين خلال دقائق.";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "بريد إلكتروني غير صالح" },
        { status: 400 }
      );
    }

    const email = parsed.data.email;
    await connectToDatabase();

    const tenant = await Tenant.findOne({ email }).select("email status isActive");

    if (tenant && tenant.isActive && tenant.status !== "SUSPENDED") {
      const emailResult = await sendPasswordResetCode(email);

      return NextResponse.json({
        success: true,
        message: emailResult.sent
          ? "تم إرسال رمز إعادة التعيين إلى بريدك الإلكتروني"
          : GENERIC_SUCCESS,
        emailSent: emailResult.sent,
        ...(emailResult.warning && { warning: emailResult.warning }),
        ...(process.env.NODE_ENV === "development" && {
          debugCode: emailResult.code,
          previewUrl: emailResult.previewUrl,
        }),
      });
    }

    return NextResponse.json({
      success: true,
      message: GENERIC_SUCCESS,
      emailSent: false,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء معالجة الطلب" },
      { status: 500 }
    );
  }
}
