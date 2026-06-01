// scripts/clear-data.ts
/**
 * سكريبت لحذف جميع البيانات من قاعدة البيانات
 * تشغيل: npx tsx scripts/clear-data.ts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

// تحميل متغيرات البيئة
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { connectToDatabase } from "@/lib/db/mongodb";
import Tenant from "@/models/Tenant";
import Store from "@/models/Store";
import Category from "@/models/Category";
import Product from "@/models/Product";
import Brand from "@/models/Brand";
import User from "@/models/User";
import Order from "@/models/Order";
import Cart from "@/models/Cart";
import Wishlist from "@/models/Wishlist";
import Notification from "@/models/Notification";
import AuditLog from "@/models/AuditLog";

async function clearDatabase() {
  try {
    console.log("🚀 جاري الاتصال بقاعدة البيانات...");
    await connectToDatabase();

    console.log("🗑️ جاري حذف جميع البيانات...");

    // حذف البيانات من جميع المجموعات
    const results = await Promise.all([
      Tenant.deleteMany({}),
      Store.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Brand.deleteMany({}),
      User.deleteMany({}),
      Order.deleteMany({}),
      Cart.deleteMany({}),
      Wishlist.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    const totalDeleted = results.reduce((sum, result) => sum + (result.deletedCount || 0), 0);
    
    console.log(`✅ تم حذف ${totalDeleted} وثيقة بنجاح`);
    console.log("\n📊 تفاصيل الحذف:");
    console.log(`   • المستأجرين (Tenant): ${results[0].deletedCount || 0}`);
    console.log(`   • المتاجر (Store): ${results[1].deletedCount || 0}`);
    console.log(`   • الفئات (Category): ${results[2].deletedCount || 0}`);
    console.log(`   • المنتجات (Product): ${results[3].deletedCount || 0}`);
    console.log(`   • العلامات التجارية (Brand): ${results[4].deletedCount || 0}`);
    console.log(`   • المستخدمين (User): ${results[5].deletedCount || 0}`);
    console.log(`   • الطلبات (Order): ${results[6].deletedCount || 0}`);
    console.log(`   • سلات التسوق (Cart): ${results[7].deletedCount || 0}`);
    console.log(`   • قوائم الرغبات (Wishlist): ${results[8].deletedCount || 0}`);
    console.log(`   • الإشعارات (Notification): ${results[9].deletedCount || 0}`);
    console.log(`   • سجلات التدقيق (AuditLog): ${results[10].deletedCount || 0}`);

    console.log("\n✨ تم مسح قاعدة البيانات بنجاح!");
    process.exit(0);
  } catch (error) {
    console.error("❌ حدث خطأ أثناء مسح البيانات:", error);
    process.exit(1);
  }
}

clearDatabase();