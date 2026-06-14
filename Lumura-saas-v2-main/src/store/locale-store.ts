import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type Locale = "en" | "ar";

interface LocaleStore {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  isRTL: boolean;
}

export const useLocaleStore = create<LocaleStore>()(
  persist(
    (set) => ({
      locale: "en",
      isRTL: false,
      setLocale: (locale) => {
        set({ locale, isRTL: locale === "ar" });
        // Apply to document immediately
        if (typeof document !== "undefined") {
          document.documentElement.lang = locale;
          document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
        }
      },
    }),
    {
      name: "locale-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
