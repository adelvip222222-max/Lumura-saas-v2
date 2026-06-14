// src/app/api/auth/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { verifyCode } from "@/lib/email/email.service";
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
    
    // ✅ تحديث حالة المستأجر إلى ACTIVE
    const tenant = await Tenant.findOneAndUpdate(
      { email },
      { 
        status: "ACTIVE",
        isActive: true 
      },
      { new: true }
    );
    
    if (!tenant) {
      return NextResponse.json(
        { error: "المستخدم غير موجود" },
        { status: 404 }
      );
    }
    
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
