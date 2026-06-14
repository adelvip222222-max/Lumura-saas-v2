// يمكنك تشغيل هذا السكريبت مرة واحدة لحذف البيانات المكررة
// src/scripts/clean-duplicates.ts
import { connectToDatabase } from "@/lib/db/mongodb";
import Tenant from "@/models/Tenant";

async function cleanDuplicates() {
  await connectToDatabase();
  
  // حذف المستأجر المكرر
  const result = await Tenant.deleteOne({ slug: "fff" });
  console.log("Deleted:", result);
  
  process.exit(0);
}

cleanDuplicates();