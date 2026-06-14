import { NextRequest, NextResponse } from "next/server";
import {
  getCustomerWishlistAction,
  toggleCustomerWishlistAction,
} from "@/actions/customer-account";

export async function GET(request: NextRequest) {
  const storeSlug = new URL(request.url).searchParams.get("storeSlug");
  if (!storeSlug) {
    return NextResponse.json({ error: "storeSlug مطلوب" }, { status: 400 });
  }

  const result = await getCustomerWishlistAction(storeSlug);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }
  return NextResponse.json(result.data);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, storeSlug } = body;
    if (!productId || !storeSlug) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }

    const result = await toggleCustomerWishlistAction(storeSlug, productId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }
    return NextResponse.json(result.data);
  } catch {
    return NextResponse.json({ error: "فشل تحديث المفضلة" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const storeSlug = new URL(request.url).searchParams.get("storeSlug");
  const productId = new URL(request.url).searchParams.get("productId");
  if (!storeSlug || !productId) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }

  const result = await toggleCustomerWishlistAction(storeSlug, productId);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }
  return NextResponse.json(result.data);
}
