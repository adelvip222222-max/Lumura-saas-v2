// src/config/site.ts
export const siteConfig = {
  name: "MEMO DEV",
  description: "منصة متكاملة لإنشاء وإدارة المتاجر الإلكترونية",
  url: "http://localhost:3000",
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
