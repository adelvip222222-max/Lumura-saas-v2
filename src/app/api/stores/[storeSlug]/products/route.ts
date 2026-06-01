// src/app/api/stores/[storeSlug]/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/mongodb";
import Product from "@/models/Product";
import Store from "@/models/Store";

export async function POST(
  request: NextRequest,
  { params }: { params: { storeSlug: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  
  const { storeSlug } = await params;
  const body = await request.json();
  
  await connectToDatabase();
  
  const store = await Store.findOne({ slug: storeSlug });
  if (!store) {
    return NextResponse.json({ error: "المتجر غير موجود" }, { status: 404 });
  }
  
  const product = await Product.create({
    ...body,
    tenantId: store.tenantId,
    storeId: store._id,
    slug: body.name.toLowerCase().replace(/ /g, '-'),
    sellingPrice: parseFloat(body.sellingPrice),
    purchasePrice: parseFloat(body.purchasePrice),
    stockQuantity: parseInt(body.stockQuantity),
    profitMargin: ((body.sellingPrice - body.purchasePrice) / body.sellingPrice) * 100,
  });
  
  return NextResponse.json(product, { status: 201 });
}