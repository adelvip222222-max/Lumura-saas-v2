import type { StorePublicTheme } from "@/lib/store/store-theme";
import { getStoreDisplayName, getStoreShortBio } from "@/lib/store/store-theme";

interface Props {
  theme: StorePublicTheme;
}

/** بانر الغلاف الكامل — الصفحة الرئيسية فقط */
export function StoreCoverHero({ theme }: Props) {
  if (!theme.coverImage) return null;

  const title = getStoreDisplayName(theme);
  const bio = getStoreShortBio(theme);

  return (
    <section className="relative h-52 sm:h-64 md:h-80 w-full overflow-hidden shrink-0">
      <img
        src={theme.coverImage}
        alt={title}
        className="h-full w-full object-cover"
        fetchPriority="high"
      />
      <div
        className="absolute inset-0 flex flex-col justify-end"
        style={{
          background: `linear-gradient(to top, color-mix(in srgb, ${theme.primaryColor} 88%, black) 0%, transparent 70%)`,
        }}
      >
        <div className="container mx-auto px-4 pb-6 pt-12">
          <div className="flex items-end gap-4">
            {theme.logo && (
              <img
                src={theme.logo}
                alt={title}
                className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl border-2 border-white object-cover shadow-xl shrink-0"
              />
            )}
            <div className="min-w-0 text-white pb-1">
              <h1 className="text-2xl sm:text-4xl font-bold font-serif tracking-tight truncate">
                {title}
              </h1>
              {bio && (
                <p className="mt-1 text-sm sm:text-base text-white/90 line-clamp-2 max-w-2xl">
                  {bio}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
