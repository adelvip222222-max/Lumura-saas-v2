// src/config/site.ts
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const siteConfig = {
  name: "MEMO DEV",
  description: "منصة متكاملة لإنشاء وإدارة المتاجر الإلكترونية",
  url: appUrl,
  keywords: ["SaaS", "store", "ecommerce"],
  currency: {
    code: "EGP",
    symbol: "£",
  },
  tax: {
    rate: 0.14, // 14%
  },
  shipping: {
    basePrice: 5,
    defaultRate: 5,
    freeAbove: 100,
    freeThreshold: 100,
  },
};

export default siteConfig;
