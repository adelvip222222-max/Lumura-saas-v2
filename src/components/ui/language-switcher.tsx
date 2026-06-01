// src/components/language-switcher.tsx
"use client";

import { useTranslation } from "@/hooks/use-translation";
import { Languages } from "lucide-react";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation();

  const toggleLanguage = () => {
    const newLocale = locale === "ar" ? "en" : "ar";
    setLocale(newLocale);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
    >
      <Languages className="h-4 w-4" />
      <span>{locale === "ar" ? "English" : "العربية"}</span>
    </button>
  );
}