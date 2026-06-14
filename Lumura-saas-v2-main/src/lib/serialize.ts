// src/lib/serialize.ts
import { serializeMongoDoc } from "@/lib/utils/serialize";

/** تحويل كائنات Mongoose / ObjectId إلى قيم JSON بسيطة */
export function serialize<T>(obj: T): T {
  return serializeMongoDoc<T>(obj);
}

export default serialize;
