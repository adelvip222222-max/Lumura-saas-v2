import { NextRequest, NextResponse } from "next/server";
import { customerRegister, setCustomerAuthCookie } from "@/lib/jwt/customer-jwt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, phone, storeSlug } = body;

    if (!name || !email || !password || !storeSlug) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }

    if (
      password.length < 8 ||
      !/[A-Za-z]/.test(password) ||
      !/\d/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      return NextResponse.json(
        { error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل وتحتوي على حروف وأرقام ورموز" },
        { status: 400 }
      );
    }

    const result = await customerRegister(
      name,
      email,
      password,
      phone || "",
      storeSlug
    );

    if (!result.success || !result.token) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await setCustomerAuthCookie(storeSlug, result.token);

    return NextResponse.json({ success: true, message: "تم إنشاء الحساب بنجاح" });
  } catch (error) {
    console.error("Customer registration error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء إنشاء الحساب" }, { status: 500 });
  }
}
