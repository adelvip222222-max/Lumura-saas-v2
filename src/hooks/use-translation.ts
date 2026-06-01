// src/hooks/use-translation.ts
"use client";

import { useCallback } from "react";
import { useLocale } from "@/providers/locale-provider";

// ✅ يمكنك استيراد ملفات JSON إذا كانت موجودة
// import ar from "@/i18n/ar.json";
// import en from "@/i18n/en.json";

// ✅ أو تعريف الترجمات هنا مباشرة
const translations: Record<string, any> = {
  ar: {
    sidebar: {
      dashboard: "لوحة التحكم",
      products: "المنتجات",
      orders: "الطلبات",
      customers: "العملاء",
      categories: "الفئات",
      brands: "الماركات",
      inventory: "المخزون",
      reports: "التقارير",
      analytics: "الإحصائيات",
      settings: "الإعدادات",
      myStores: "متاجري",
      backToAllStores: "← العودة إلى جميع المتاجر",
      signOut: "تسجيل الخروج",
      collapse: "طي القائمة",
      expand: "توسيع القائمة",
      language: "English"
    },
    nav: {
      home: "الرئيسية",
      products: "المنتجات",
      cart: "السلة",
      account: "الحساب"
    }
  },
  en: {
    sidebar: {
      dashboard: "Dashboard",
      products: "Products",
      orders: "Orders",
      customers: "Customers",
      categories: "Categories",
      brands: "Brands",
      inventory: "Inventory",
      reports: "Reports",
      analytics: "Analytics",
      settings: "Settings",
      myStores: "My Stores",
      backToAllStores: "← Back to all stores",
      signOut: "Sign Out",
      collapse: "Collapse",
      expand: "Expand",
      language: "العربية"
    },
    nav: {
      home: "Home",
      products: "Products",
      cart: "Cart",
      account: "Account"
    }
  }
};

export function useTranslation() {
  const { locale, setLocale, toggleLocale, isRTL } = useLocale();

  const t = useCallback(
    (key: string, defaultValue?: string): string => {
      const keys = key.split(".");
      let value: any = translations[locale] || translations.ar;

      for (const k of keys) {
        if (value && typeof value === "object" && k in value) {
          value = value[k];
        } else {
          // ✅ إرجاع القيمة الافتراضية أو آخر جزء من المفتاح
          return defaultValue || keys[keys.length - 1] || key;
        }
      }

      return typeof value === "string" ? value : defaultValue || key;
    },
    [locale]
  );

  return {
    t,
    locale,
    setLocale,
    toggleLocale,
    isRTL,
  };
}