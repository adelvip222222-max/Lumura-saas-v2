// src/models/index.ts
/**
 * ملف مركزي لتسجيل جميع نماذج Mongoose
 * يجب استيراد هذا الملف قبل استخدام أي نموذج
 */

import "./Tenant";
import "./Store";
import "./User";
import "./Category";
import "./Brand";
import "./Product";
import "./Order";
import "./Cart";
import "./Wishlist";
import "./Notification";
import "./AuditLog";

// إعادة تصدير جميع النماذج
export { default as Tenant } from "./Tenant";
export { default as Store } from "./Store";
export { default as User } from "./User";
export { default as Category } from "./Category";
export { default as Brand } from "./Brand";
export { default as Product } from "./Product";
export { default as Order } from "./Order";
export { default as Cart } from "./Cart";
export { default as Wishlist } from "./Wishlist";
export { default as Notification } from "./Notification";
export { default as AuditLog } from "./AuditLog";