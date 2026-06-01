import "server-only";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAdministrationContext } from "@/lib/administration/context";
import { connectToDatabase } from "@/lib/db/mongodb";
import Product from "@/models/Product";

export async function getAdministrationInventory() {
  const ctx = await getAdministrationContext("manage_inventory");
  await connectToDatabase();

  const products = await Product.find({ storeId: ctx.storeId, isDeleted: false })
    .select("name sku stockQuantity soldQuantity lowStockThreshold isActive")
    .sort({ stockQuantity: 1 })
    .limit(60)
    .lean();

  return {
    store: { name: ctx.storeName, slug: ctx.storeSlug },
    products: products.map((product: any) => ({
      id: product._id.toString(),
      name: product.name,
      sku: product.sku,
      stockQuantity: product.stockQuantity ?? 0,
      soldQuantity: product.soldQuantity ?? 0,
      lowStockThreshold: product.lowStockThreshold ?? 10,
      isActive: Boolean(product.isActive),
    })),
  };
}
