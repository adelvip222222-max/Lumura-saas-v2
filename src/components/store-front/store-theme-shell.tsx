"use client";

import { createContext, useContext } from "react";
import type { StorePublicTheme } from "@/lib/store/store-theme";
const StoreThemeContext = createContext<StorePublicTheme | null>(null);

export function useStoreTheme(): StorePublicTheme {
  const ctx = useContext(StoreThemeContext);
  if (!ctx) {
    throw new Error("useStoreTheme must be used within StoreThemeShell");
  }
  return ctx;
}

interface Props {
  theme: StorePublicTheme;
  children: React.ReactNode;
}

export function StoreThemeShell({ theme, children }: Props) {
  const isRtl = theme.language === "ar";

  return (
    <StoreThemeContext.Provider value={theme}>
      <div
        className="store-front flex min-h-screen flex-col"
        dir={isRtl ? "rtl" : "ltr"}
        lang={theme.language}
        data-store-slug={theme.slug}
        style={{
          "--store-primary": theme.primaryColor,
          "--store-secondary": theme.secondaryColor,
          "--store-primary-muted": `color-mix(in srgb, ${theme.primaryColor} 12%, white)`,
          "--store-primary-soft": `color-mix(in srgb, ${theme.primaryColor} 18%, transparent)`,
          "--store-bg": `color-mix(in srgb, ${theme.secondaryColor} 8%, #fdfbf7)`,
          backgroundColor: "var(--store-bg)",
        } as React.CSSProperties}
      >
        {children}
      </div>
    </StoreThemeContext.Provider>
  );
}
