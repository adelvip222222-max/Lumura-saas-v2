// src/hooks/use-translation.ts
"use client";

import { useCallback, useEffect, useState } from "react";

// ✅ استيراد ملفات الترجمة مباشرة
import ar from "@/i18n/messages/ar.json";
import en from "@/i18n/messages/en.json";

const translations: Record<string, any> = { ar, en };

export function useTranslation() {
  const [locale, setLocaleState] = useState("ar");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // ✅ قراءة اللغة من localStorage
    try {
      const savedLocale = localStorage.getItem("app-locale");
      if (savedLocale && translations[savedLocale]) {
        setLocaleState(savedLocale);
      }
    } catch (error) {
      console.warn("Failed to read locale:", error);
    }
  }, []);

  const t = useCallback(
    (key: string, defaultValue?: string): string => {
      const keys = key.split(".");
      let value: any = translations[locale] || translations.ar;
      
      for (const k of keys) {
        if (value && typeof value === "object" && k in value) {
          value = value[k];
        } else {
          // ✅ إذا لم يجد المفتاح، أرجع المفتاح الأخير كاسم
          const fallback = key.split('.').pop() || key;
          console.warn(`Translation key not found: "${key}"`);
          return defaultValue || fallback;
        }
      }
      
      return typeof value === "string" ? value : defaultValue || key;
    },
    [locale]
  );

  const setLocale = useCallback((newLocale: string) => {
    if (translations[newLocale]) {
      setLocaleState(newLocale);
      try {
        localStorage.setItem("app-locale", newLocale);
      } catch (error) {
        console.warn("Failed to save locale:", error);
      }
      document.documentElement.dir = newLocale === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = newLocale;
    }
  }, []);

  return {
    t,
    locale,
    isRTL: locale === "ar",
    setLocale, // ✅ تصدير setLocale
  };
}