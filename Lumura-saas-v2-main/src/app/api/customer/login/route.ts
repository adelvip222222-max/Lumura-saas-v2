import { NextRequest, NextResponse } from "next/server";
import { customerLogin, setCustomerAuthCookie } from "@/lib/jwt/customer-jwt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, storeSlug } = body;

    if (!email || !password || !storeSlug) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }

    const result = await customerLogin(email, password, storeSlug);
    if (!result.success || !result.token) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    await setCustomerAuthCookie(storeSlug, result.token);

    return NextResponse.json({ success: true, message: "تم تسجيل الدخول بنجاح" });
  } catch (error) {
    console.error("Customer login error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء تسجيل الدخول" }, { status: 500 });
  }
}
