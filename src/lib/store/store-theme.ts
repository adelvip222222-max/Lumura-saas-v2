import type { Metadata } from "next";

/** بيانات الهوية البصرية للمتجر — تُمرَّر من السيرفر للواجهة */
export interface StorePublicTheme {
  slug: string;
  name: string;
  nameEn: string;
  shortBio?: string;
  shortBioEn?: string;
  logo?: string;
  favicon?: string;
  coverImage?: string;
  coverImages?: Array<{ url: string; publicId?: string; alt?: string }>;
  email?: string;
  phone?: string;
  address?: string;
  language: "ar" | "en";
  currency: string;
  primaryColor: string;
  secondaryColor: string;
}

type StoreDoc = {
  slug: string;
  name: string;
  nameEn?: string;
  shortBio?: string;
  shortBioEn?: string;
  logo?: string;
  favicon?: string;
  coverImage?: string;
  coverImages?: Array<{ url: string; publicId?: string; alt?: string }>;
  email?: string;
  phone?: string;
  address?: string;
  settings?: {
    language?: string;
    currency?: string;
    theme?: { primaryColor?: string; secondaryColor?: string };
  };
  seo?: {
    title?: string;
    titleEn?: string;
    description?: string;
    descriptionEn?: string;
    keywords?: string[];
  };
  description?: string;
};

export function buildStorePublicTheme(store: StoreDoc): StorePublicTheme {
  return {
    slug: store.slug,
    name: store.name,
    nameEn: store.nameEn || store.name,
    shortBio: store.shortBio,
    shortBioEn: store.shortBioEn,
    logo: store.logo,
    favicon: store.favicon,
    coverImage: store.coverImage,
    coverImages: Array.isArray(store.coverImages)
      ? store.coverImages.filter((image) => image?.url).slice(0, 3)
      : store.coverImage
        ? [{ url: store.coverImage }]
        : [],
    email: store.email,
    phone: store.phone,
    address: store.address,
    language: store.settings?.language === "en" ? "en" : "ar",
    currency: store.settings?.currency || "EGP",
    primaryColor: store.settings?.theme?.primaryColor || "#f97316",
    secondaryColor: store.settings?.theme?.secondaryColor || "#10b981",
  };
}

export function getStoreDisplayName(theme: StorePublicTheme): string {
  return theme.language === "en" ? theme.nameEn : theme.name;
}

export function getStoreShortBio(theme: StorePublicTheme): string | undefined {
  if (theme.language === "en") {
    return theme.shortBioEn || theme.shortBio;
  }
  return theme.shortBio || theme.shortBioEn;
}


export function buildStorePageMetadata(
  store: StoreDoc,
  theme: StorePublicTheme,
  pageTitle?: string
): Metadata {
  const isAr = theme.language === "ar";
  const siteTitle =
    (isAr ? store.seo?.title : store.seo?.titleEn) || getStoreDisplayName(theme);
  const description =
    (isAr ? store.seo?.description : store.seo?.descriptionEn) ||
    getStoreShortBio(theme) ||
    store.description ||
    (isAr ? `تسوق من ${theme.name}` : `Shop at ${theme.nameEn}`);

  const iconUrl = theme.favicon || theme.logo;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    metadataBase: new URL(appUrl),
    title: pageTitle
      ? `${pageTitle} | ${siteTitle}`
      : { default: siteTitle, template: `%s | ${siteTitle}` },
    description: description.slice(0, 160),
    keywords: store.seo?.keywords,
    icons: iconUrl
      ? {
          icon: [{ url: iconUrl }],
          shortcut: [iconUrl],
          apple: [{ url: iconUrl }],
        }
      : theme.logo
        ? {
            icon: [{ url: theme.logo }],
            apple: [{ url: theme.logo }],
          }
        : undefined,
    openGraph: {
      title: siteTitle,
      description: description.slice(0, 200),
      siteName: siteTitle,
      images: (theme.coverImages?.[0]?.url || theme.coverImage)
        ? [{ url: theme.coverImages?.[0]?.url || theme.coverImage || "", width: 1200, height: 630, alt: siteTitle }]
        : theme.logo
          ? [{ url: theme.logo, alt: siteTitle }]
          : undefined,
      type: "website",
    },
  };
}
