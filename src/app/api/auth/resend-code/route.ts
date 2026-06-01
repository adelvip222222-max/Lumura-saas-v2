// src/app/api/auth/resend-code/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sendVerificationCode } from "@/lib/email/email.service";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "البريد الإلكتروني مطلوب" }, { status: 400 });
    }

    const emailResult = await sendVerificationCode(String(email).trim().toLowerCase());

    return NextResponse.json({
      success: true,
      message: emailResult.sent
        ? "تم إرسال رمز التحقق الجديد"
        : "تعذّر إرسال البريد. حاول مرة أخرى أو راجع إعدادات SMTP.",
      emailSent: emailResult.sent,
      ...(emailResult.warning && { warning: emailResult.warning }),
      ...(process.env.NODE_ENV === "development" && {
        debugCode: emailResult.code,
        previewUrl: emailResult.previewUrl,
      }),
    });
  } catch (error) {
    console.error("Resend code error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إرسال الرمز" },
      { status: 500 }
    );
  }
}
