// src/app/api/customer/session/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCustomerFromCookie } from "@/lib/jwt/customer-jwt";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeSlug = searchParams.get("storeSlug");

    if (!storeSlug) {
      return NextResponse.json({ error: "Store slug is required" }, { status: 400 });
    }

    const customer = await getCustomerFromCookie(storeSlug);
    
    if (!customer) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const sessionCustomer = {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      storeId: customer.storeId,
      storeSlug: customer.storeSlug,
      storeName: customer.storeName,
    };

    return NextResponse.json({
      user: sessionCustomer,
      customer: sessionCustomer,
    });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
