import { Mail, MapPin, Phone } from "lucide-react";
import type { StorePublicTheme } from "@/lib/store/store-theme";
import { getStoreDisplayName } from "@/lib/store/store-theme";

export function StoreFooter({ theme }: { theme: StorePublicTheme }) {
  const isAr = theme.language === "ar";
  const displayName = getStoreDisplayName(theme);

  return (
    <footer
      className="border-t bg-white mt-auto store-border-primary"
      style={{
        borderTopColor: "color-mix(in srgb, var(--store-primary) 18%, #e5e7eb)",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            {theme.logo && (
              <img
                src={theme.logo}
                alt={displayName}
                className="h-12 w-12 rounded-xl object-cover shrink-0"
              />
            )}
            <div>
              <p className="font-semibold text-slate-900" style={{ color: "var(--store-primary)" }}>
                {displayName}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                © {new Date().getFullYear()}{" "}
                {isAr ? "جميع الحقوق محفوظة" : "All rights reserved"}
              </p>
            </div>
          </div>

          {(theme.email || theme.phone || theme.address) && (
            <div className="space-y-2 text-sm text-slate-600">
              {theme.email && (
                <a
                  href={`mailto:${theme.email}`}
                  className="flex items-center gap-2 store-text-primary hover:opacity-80"
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  {theme.email}
                </a>
              )}
              {theme.phone && (
                <a
                  href={`tel:${theme.phone}`}
                  className="flex items-center gap-2 store-text-primary hover:opacity-80"
                  dir="ltr"
                >
                  <Phone className="h-4 w-4 shrink-0" />
                  {theme.phone}
                </a>
              )}
              {theme.address && (
                <p className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5 store-text-primary" />
                  {theme.address}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
