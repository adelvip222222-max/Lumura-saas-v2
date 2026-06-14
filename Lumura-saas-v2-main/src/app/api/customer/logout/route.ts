import { NextRequest, NextResponse } from "next/server";
import { clearCustomerAuthCookie } from "@/lib/jwt/customer-jwt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const storeSlug =
      body.storeSlug || new URL(request.url).searchParams.get("storeSlug");

    if (!storeSlug) {
      return NextResponse.json({ error: "storeSlug مطلوب" }, { status: 400 });
    }

    await clearCustomerAuthCookie(storeSlug);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل تسجيل الخروج" }, { status: 500 });
  }
}
