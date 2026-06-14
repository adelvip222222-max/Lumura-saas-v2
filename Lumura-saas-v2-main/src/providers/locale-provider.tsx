// src/providers/locale-provider.tsx
"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

type Locale = "ar" | "en";

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  isRTL: boolean;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

// ✅ هذا هو التصدير المهم
export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ar");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // ✅ قراءة اللغة المحفوظة من localStorage
    const savedLocale = localStorage.getItem("app-locale") as Locale;
    if (savedLocale && (savedLocale === "ar" || savedLocale === "en")) {
      setLocaleState(savedLocale);
    } else {
      // ✅ إذا لم تكن محفوظة، استخدم العربية كافتراضي
      setLocaleState("ar");
    }
    setMounted(true);
  }, []);

  // ✅ تطبيق إعدادات اللغة على HTML
  useEffect(() => {
    if (mounted) {
      document.documentElement.lang = locale;
      document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    }
  }, [locale, mounted]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("app-locale", newLocale);
    // ✅ إعادة تحميل الصفحة لتطبيق التغييرات
    window.location.reload();
  }, []);

  const toggleLocale = useCallback(() => {
    const newLocale = locale === "ar" ? "en" : "ar";
    setLocale(newLocale);
  }, [locale, setLocale]);

  const isRTL = locale === "ar";

  // ✅ عرض شاشة تحميل بسيطة حتى يتم التحميل
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent"></div>
          <p className="text-gray-500 text-sm">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, toggleLocale, isRTL }}>
      {children}
    </LocaleContext.Provider>
  );
}