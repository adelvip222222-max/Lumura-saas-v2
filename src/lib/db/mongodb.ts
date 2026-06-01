// src/lib/db/mongodb.ts
import mongoose from "mongoose";
import dotenv from "dotenv";

// تحميل متغيرات البيئة
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/lumora-saas";

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined in environment variables");
  console.error("Please create a .env.local file with MONGODB_URI=mongodb://localhost:27017/lumora-saas");
  throw new Error("MONGODB_URI environment variable is required");
}

// تحسين الاتصال لـ Next.js 15
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    }).catch((err) => {
      console.error("❌ Database connection error:", err.message);
      cached.promise = null;
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// اختياري: مراقبة حالة الاتصال
mongoose.connection.on("disconnected", () => {
  console.log("⚠️ Database disconnected");
});

mongoose.connection.on("reconnected", () => {
  console.log("🔄 Database reconnected");
});

export default connectToDatabase;
