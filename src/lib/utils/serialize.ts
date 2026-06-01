// src/lib/utils/serialize.ts
import mongoose from "mongoose";

function jsonReplacer(_key: string, value: unknown): unknown {
  if (value instanceof mongoose.Types.ObjectId) {
    return value.toString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (value instanceof Map) {
    return Object.fromEntries(value);
  }
  return value;
}

/**
 * تحويل مستند MongoDB (lean أو Mongoose) إلى plain object آمن لـ Client Components
 */
export function serializeMongoDoc<T = unknown>(doc: unknown): T {
  if (doc == null) return doc as T;

  if (Array.isArray(doc)) {
    return doc.map((item) => serializeMongoDoc(item)) as T;
  }

  if (typeof doc === "object") {
    const record = doc as Record<string, unknown>;
    if (typeof record.toJSON === "function") {
      return JSON.parse(
        JSON.stringify(record.toJSON(), jsonReplacer)
      ) as T;
    }
    if (typeof record.toObject === "function") {
      return JSON.parse(
        JSON.stringify(
          (record.toObject as (opts?: { virtuals?: boolean }) => unknown).call(
            doc,
            { virtuals: false }
          ),
          jsonReplacer
        )
      ) as T;
    }
    return JSON.parse(JSON.stringify(doc, jsonReplacer)) as T;
  }

  return doc as T;
}

/**
 * تحويل مصفوفة مستندات MongoDB
 */
export function serializeMongoDocs<T = unknown>(docs: unknown): T[] {
  if (!docs || !Array.isArray(docs)) return [];
  return docs.map((doc) => serializeMongoDoc<T>(doc));
}

/** @deprecated استخدم serializeMongoDoc */
export function serializeToPlain<T = unknown>(data: unknown): T {
  return serializeMongoDoc<T>(data);
}
