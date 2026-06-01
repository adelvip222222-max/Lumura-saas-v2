// src/lib/customer/store-owner.ts
import { connectToDatabase } from "@/lib/db/mongodb";
import { verifyUnifiedToken } from "@/lib/jwt/auth-jwt";
import { cookies } from "next/headers";
import Store from "@/models/Store";
import Tenant from "@/models/Tenant";

export async function isStoreOwnerForSlug(
  userId: string,
  storeSlug: string,
  userRole?: string
): Promise<boolean> {
  await connectToDatabase();
  
  const store = await Store.findOne({ slug: storeSlug, isDeleted: false });
  if (!store) return false;
  
  // المستأجر (owner) يمكنه الوصول
  const tenant = await Tenant.findById(store.tenantId);
  if (tenant && tenant._id.toString() === userId) return true;
  
  // موظف المتجر يمكنه الوصول
  if (userRole === "store_staff") {
    const User = (await import("@/models/User")).default;
    const staff = await User.findOne({ 
      _id: userId, 
      storeId: store._id,
      role: "store_staff",
      isActive: true 
    });
    return !!staff;
  }
  
  return false;
}

export async function getStoreOwnerDashboardUrl(
  storeSlug: string
): Promise<string | null> {
  const cookieStore = await cookies();
  const staffToken = cookieStore.get("staff-token")?.value;
  const tenantToken = cookieStore.get("tenant-token")?.value;

  if (staffToken) {
    const staff = verifyUnifiedToken(staffToken);
    if (staff?.role === "staff" && staff.storeSlug === storeSlug) {
      return `/dashboard/stores/${storeSlug}`;
    }
  }

  if (tenantToken) {
    const tenant = verifyUnifiedToken(tenantToken);
    if (tenant?.role !== "tenant" || !tenant.tenantId) return null;

    await connectToDatabase();
    const store = await Store.findOne({
      slug: storeSlug,
      tenantId: tenant.tenantId,
      isDeleted: false,
    })
      .select("_id")
      .lean();

    return store ? `/dashboard/stores/${storeSlug}` : null;
  }

  return null;
}
