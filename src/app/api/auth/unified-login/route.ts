// src/app/api/auth/unified-login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { unifiedLogin, setAuthCookie } from "@/lib/jwt/auth-jwt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, storeSlug, userType } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "البريد الإلكتروني وكلمة المرور مطلوبة" }, { status: 400 });
    }

    const result = await unifiedLogin(email, password, storeSlug, userType);

    if (!result.success || !result.token) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    await setAuthCookie(result.user!.role, result.token, result.user!.storeSlug);

    let redirectUrl = "/";
    if (result.user?.role === "tenant") {
      redirectUrl = "/dashboard";
    } else if (result.user?.role === "staff") {
      redirectUrl = `/dashboard/stores/${result.user.storeSlug}`;
    } else if (result.user?.role === "customer") {
      redirectUrl = `/${result.user.storeSlug}/account`;
    }

    return NextResponse.json({
      success: true,
      message: "تم تسجيل الدخول بنجاح",
      redirectUrl,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        storeSlug: result.user.storeSlug,
      },
    });
  } catch (error) {
    console.error("Unified login error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء تسجيل الدخول" }, { status: 500 });
  }
}