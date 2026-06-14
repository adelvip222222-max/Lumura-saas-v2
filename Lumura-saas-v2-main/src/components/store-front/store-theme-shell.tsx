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

function getFontStack(font: StorePublicTheme["fontFamily"]): string {
  switch (font) {
    case "cairo":
      return "Cairo, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    case "tajawal":
      return "Tajawal, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    case "inter":
      return "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    default:
      return "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  }
}

function getRadiusValue(radius: StorePublicTheme["cornerRadius"]): string {
  switch (radius) {
    case "sharp":
      return "0px";
    case "rounded":
      return "28px";
    default:
      return "16px";
  }
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
        data-theme-preset={theme.themePreset}
        data-product-grid={theme.productGridStyle}
        data-filters-placement={theme.filtersPlacement}
        data-hero-style={theme.heroStyle}
        data-icon-style={theme.iconStyle}
        data-corner-radius={theme.cornerRadius}
        style={{
          "--store-primary": theme.primaryColor,
          "--store-secondary": theme.secondaryColor,
          "--store-primary-muted": `color-mix(in srgb, ${theme.primaryColor} 12%, white)`,
          "--store-primary-soft": `color-mix(in srgb, ${theme.primaryColor} 18%, transparent)`,
          "--store-secondary-soft": `color-mix(in srgb, ${theme.secondaryColor} 18%, transparent)`,
          "--store-bg": `color-mix(in srgb, ${theme.secondaryColor} 8%, #fdfbf7)`,
          "--store-radius": getRadiusValue(theme.cornerRadius),
          "--store-font": getFontStack(theme.fontFamily),
          backgroundColor: "var(--store-bg)",
          fontFamily: "var(--store-font)",
        } as React.CSSProperties}
      >
        {children}
      </div>
    </StoreThemeContext.Provider>
  );
}
