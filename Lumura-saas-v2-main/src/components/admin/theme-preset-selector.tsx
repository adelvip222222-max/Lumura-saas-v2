"use client";

import { Check, Filter, Grid2X2, ImageIcon, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import { STORE_THEMES, type StoreTheme } from "@/config/store-themes";

interface ThemePresetSelectorProps {
  value: string;
  onChange: (theme: StoreTheme) => void;
  isAr: boolean;
}

const labels = {
  productGridStyle: {
    classic: { ar: "كلاسيك", en: "Classic" },
    compact: { ar: "مضغوط", en: "Compact" },
    editorial: { ar: "تحريري", en: "Editorial" },
    masonry: { ar: "بوتيك", en: "Boutique" },
  },
  filtersPlacement: {
    top: { ar: "أعلى", en: "Top" },
    sidebar: { ar: "جانبي", en: "Sidebar" },
    drawer: { ar: "موبايل", en: "Drawer" },
  },
  heroStyle: {
    split: { ar: "منقسم", en: "Split" },
    centered: { ar: "مركزي", en: "Centered" },
    editorial: { ar: "تحريري", en: "Editorial" },
  },
  fontFamily: {
    system: { ar: "افتراضي", en: "System" },
    cairo: { ar: "Cairo", en: "Cairo" },
    tajawal: { ar: "Tajawal", en: "Tajawal" },
    inter: { ar: "Inter", en: "Inter" },
  },
} as const;

export function ThemePresetSelector({ value, onChange, isAr }: ThemePresetSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {STORE_THEMES.map((theme) => (
        <button
          key={theme.id}
          type="button"
          onClick={() => onChange(theme)}
          className={cn(
            "relative flex flex-col gap-3 rounded-2xl border-2 p-4 text-start transition-all hover:-translate-y-0.5 hover:shadow-md",
            value === theme.id
              ? "border-primary bg-primary/5 shadow-md"
              : "border-border hover:border-primary/30"
          )}
        >
          {value === theme.id && (
            <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="h-3.5 w-3.5" />
            </span>
          )}

          {theme.previewImage && (
            <div className="overflow-hidden rounded-xl border bg-muted">
              <img src={theme.previewImage} alt={theme.label} className="h-28 w-full object-cover" />
            </div>
          )}

          <div>
            <h3 className="font-semibold text-sm">{isAr ? theme.labelAr : theme.label}</h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {isAr ? theme.descriptionAr : theme.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
              <Grid2X2 className="h-3 w-3" />
              {isAr ? labels.productGridStyle[theme.productGridStyle].ar : labels.productGridStyle[theme.productGridStyle].en}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
              <Filter className="h-3 w-3" />
              {isAr ? labels.filtersPlacement[theme.filtersPlacement].ar : labels.filtersPlacement[theme.filtersPlacement].en}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
              <ImageIcon className="h-3 w-3" />
              {isAr ? labels.heroStyle[theme.heroStyle].ar : labels.heroStyle[theme.heroStyle].en}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
              <Type className="h-3 w-3" />
              {isAr ? labels.fontFamily[theme.fontFamily].ar : labels.fontFamily[theme.fontFamily].en}
            </span>
          </div>

          <div className="flex gap-2">
            <div className="h-6 w-6 rounded-full border shadow-sm" style={{ backgroundColor: theme.primaryColor }} title="Primary" />
            <div className="h-6 w-6 rounded-full border shadow-sm" style={{ backgroundColor: theme.secondaryColor }} title="Secondary" />
          </div>
        </button>
      ))}
    </div>
  );
}
