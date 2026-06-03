"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { STORE_THEMES } from "@/config/store-themes";

interface ThemePresetSelectorProps {
  value: string;
  onChange: (themeId: string, primaryColor: string, secondaryColor: string) => void;
  isAr: boolean;
}

export function ThemePresetSelector({ value, onChange, isAr }: ThemePresetSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {STORE_THEMES.map((theme) => (
        <button
          key={theme.id}
          type="button"
          onClick={() => onChange(theme.id, theme.primaryColor, theme.secondaryColor)}
          className={cn(
            "relative flex flex-col gap-3 rounded-xl border-2 p-4 transition-all hover:shadow-md",
            value === theme.id
              ? "border-primary bg-primary/5 shadow-md"
              : "border-border hover:border-primary/30"
          )}
        >
          {value === theme.id && (
            <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="h-3 w-3" />
            </span>
          )}

          {/* Preview Image */}
          {theme.previewImage && (
            <div className="overflow-hidden rounded-lg border bg-muted">
              <img
                src={theme.previewImage}
                alt={theme.label}
                className="h-24 w-full object-cover"
              />
            </div>
          )}

          {/* Theme Name */}
          <div>
            <h3 className="font-semibold text-sm">
              {isAr ? theme.labelAr : theme.label}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {isAr ? theme.descriptionAr : theme.description}
            </p>
          </div>

          {/* Color Preview */}
          <div className="flex gap-2">
            <div
              className="h-6 w-6 rounded border shadow-sm"
              style={{ backgroundColor: theme.primaryColor }}
              title="Primary"
            />
            <div
              className="h-6 w-6 rounded border shadow-sm"
              style={{ backgroundColor: theme.secondaryColor }}
              title="Secondary"
            />
          </div>
        </button>
      ))}
    </div>
  );
}
