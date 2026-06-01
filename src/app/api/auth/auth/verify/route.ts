// src/app/api/auth/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { verifyCode } from "@/lib/email/email.service";
import User from "@/models/User";
import Tenant from "@/models/Tenant";

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();
    
    // التحقق من الرمز
    const isValid = await verifyCode(email, code);
    
    if (!isValid) {
      return NextResponse.json(
        { error: "رمز التحقق غير صحيح أو منتهي الصلاحية" },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // تحديث حالة المستخدم والمستأجر
    await User.findOneAndUpdate({ email }, { emailVerified: new Date() });
    await Tenant.findOneAndUpdate({ email }, { status: "ACTIVE" });
    
    return NextResponse.json({
      success: true,
      message: "تم التحقق من البريد الإلكتروني بنجاح",
    });
    
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء التحقق" },
      { status: 500 }
    );
  }
}
