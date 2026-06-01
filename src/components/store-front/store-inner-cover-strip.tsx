"use client";

import { usePathname } from "next/navigation";
import type { StorePublicTheme } from "@/lib/store/store-theme";
import { getStoreDisplayName } from "@/lib/store/store-theme";

export function StoreInnerCoverStrip({ theme }: { theme: StorePublicTheme }) {
  const pathname = usePathname();
  const homePaths = [`/${theme.slug}`, `/${theme.slug}/`];
  const isHome = homePaths.includes(pathname);

  if (isHome || !theme.coverImage) return null;

  const displayName = getStoreDisplayName(theme);

  return (
    <div className="relative h-16 w-full overflow-hidden shrink-0 border-b store-border-primary">
      <img src={theme.coverImage} alt="" className="h-full w-full object-cover object-center" />
      <div
        className="absolute inset-0 flex items-center gap-2.5 px-4"
        style={{
          background: `linear-gradient(${theme.language === "ar" ? "270deg" : "90deg"}, color-mix(in srgb, ${theme.primaryColor} 80%, black), transparent)`,
        }}
      >
        {theme.logo && (
          <img
            src={theme.logo}
            alt=""
            className="h-8 w-8 rounded-full border border-white object-cover shadow"
          />
        )}
        <span className="text-xs font-bold text-white truncate">{displayName}</span>
      </div>
    </div>
  );
}
