// src/app/api/products/[productId]/validate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import Product from "@/models/Product";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json({ valid: false, error: "Invalid product ID" });
    }
    
    await connectToDatabase();
    
    const product = await Product.findOne({
      _id: new mongoose.Types.ObjectId(productId),
      isActive: true,
      isDeleted: false,
    }).select("_id name sellingPrice stockQuantity");
    
    if (!product) {
      return NextResponse.json({ valid: false, error: "Product not found" });
    }
    
    return NextResponse.json({ 
      valid: true, 
      product: {
        id: product._id,
        name: product.name,
        price: product.sellingPrice,
        stock: product.stockQuantity,
      }
    });
  } catch (error) {
    console.error("Validate product error:", error);
    return NextResponse.json({ valid: false, error: "Server error" });
  }
}