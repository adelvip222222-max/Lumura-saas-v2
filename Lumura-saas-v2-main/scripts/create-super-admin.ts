/**
 * إنشاء حساب مدير المنصة (super_admin)
 * التشغيل: npx tsx scripts/create-super-admin.ts
 *
 * المتغيرات الاختيارية في .env.local:
 * SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, SUPER_ADMIN_NAME
 */

import dotenv from "dotenv";
import path from "path";
import bcrypt from "bcryptjs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { connectToDatabase } from "../src/lib/db/mongodb";
import Tenant from "../src/models/Tenant";

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL ?? "admin@memodev.com";
  const password = process.env.SUPER_ADMIN_PASSWORD ?? "SuperAdmin123!";
  const name = process.env.SUPER_ADMIN_NAME ?? "مدير المنصة";
  const slug = "platform-admin";

  await connectToDatabase();

  const existing = await Tenant.findOne({ email });
  if (existing) {
    existing.role = "super_admin";
    existing.status = "ACTIVE";
    existing.isActive = true;
    if (password && process.env.SUPER_ADMIN_PASSWORD) {
      existing.password = await bcrypt.hash(password, 12);
    }
    await existing.save();
    console.log("✅ تم تحديث حساب super_admin:", email);
    process.exit(0);
  }

  const subscriptionEnd = new Date();
  subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 10);

  await Tenant.create({
    slug,
    name,
    email,
    password: await bcrypt.hash(password, 12),
    role: "super_admin",
    status: "ACTIVE",
    plan: "YEARLY",
    subscriptionStart: new Date(),
    subscriptionEnd,
    maxStores: 999,
    maxProducts: 999999,
    maxStaff: 999,
    isActive: true,
  });

  console.log("✅ تم إنشاء super_admin");
  console.log("   البريد:", email);
  console.log("   كلمة المرور:", process.env.SUPER_ADMIN_PASSWORD ? "(من .env)" : password);
  console.log("   الدخول: /login ثم /super-admin");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
