import { NextRequest, NextResponse } from "next/server";
import {
  getCustomerFromCookie,
  updateCustomerProfile,
} from "@/lib/jwt/customer-jwt";
import { connectToDatabase } from "@/lib/db/mongodb";
import User from "@/models/User";
import Order from "@/models/Order";

export async function GET(request: NextRequest) {
  try {
    const storeSlug = new URL(request.url).searchParams.get("storeSlug");
    if (!storeSlug) {
      return NextResponse.json({ error: "storeSlug مطلوب" }, { status: 400 });
    }

    const customer = await getCustomerFromCookie(storeSlug);
    if (!customer) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(customer.id).select("-password").lean();
    const orders = await Order.find({
      userId: customer.id,
      storeId: customer.storeId,
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({ user, orders, customer });
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const storeSlug = new URL(request.url).searchParams.get("storeSlug");
    if (!storeSlug) {
      return NextResponse.json({ error: "storeSlug مطلوب" }, { status: 400 });
    }

    const customer = await getCustomerFromCookie(storeSlug);
    if (!customer) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const user = await updateCustomerProfile(customer.id, {
      name: body.name,
      phone: body.phone,
    });

    return NextResponse.json({ success: true, user });
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
