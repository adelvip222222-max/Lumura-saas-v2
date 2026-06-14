export type ProductGridStyle = "classic" | "compact" | "editorial" | "masonry";
export type FiltersPlacement = "top" | "sidebar" | "drawer";
export type HeroStyle = "split" | "centered" | "editorial";
export type IconStyle = "outline" | "solid" | "duotone";
export type StoreFont = "system" | "cairo" | "tajawal" | "inter";
export type StoreRadius = "sharp" | "soft" | "rounded";

export interface StoreTheme {
  id: string;
  label: string;
  labelAr: string;
  description: string;
  descriptionAr: string;
  primaryColor: string;
  secondaryColor: string;
  productGridStyle: ProductGridStyle;
  filtersPlacement: FiltersPlacement;
  heroStyle: HeroStyle;
  iconStyle: IconStyle;
  fontFamily: StoreFont;
  cornerRadius: StoreRadius;
  previewImage?: string;
}

export const STORE_THEMES: StoreTheme[] = [
  {
    id: "modern",
    label: "Modern",
    labelAr: "عصري",
    description: "Clean storefront with balanced hero and classic product cards",
    descriptionAr: "واجهة نظيفة بهيرو متوازن وكروت منتجات كلاسيكية",
    primaryColor: "#f97316",
    secondaryColor: "#10b981",
    productGridStyle: "classic",
    filtersPlacement: "top",
    heroStyle: "split",
    iconStyle: "duotone",
    fontFamily: "system",
    cornerRadius: "soft",
    previewImage: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 220 132'%3E%3Crect width='220' height='132' fill='%23fff7ed'/%3E%3Crect x='16' y='18' width='88' height='36' rx='8' fill='%23f97316' opacity='.9'/%3E%3Crect x='116' y='18' width='88' height='56' rx='12' fill='%2310b981' opacity='.18'/%3E%3Crect x='16' y='82' width='54' height='34' rx='8' fill='%23fff' stroke='%23fed7aa'/%3E%3Crect x='83' y='82' width='54' height='34' rx='8' fill='%23fff' stroke='%23fed7aa'/%3E%3Crect x='150' y='82' width='54' height='34' rx='8' fill='%23fff' stroke='%23fed7aa'/%3E%3C/svg%3E",
  },
  {
    id: "luxury",
    label: "Luxury",
    labelAr: "فاخر",
    description: "Editorial layout, dark accent, sharp premium details",
    descriptionAr: "تخطيط تحريري بلمسات داكنة وفخامة حادة",
    primaryColor: "#111827",
    secondaryColor: "#f59e0b",
    productGridStyle: "editorial",
    filtersPlacement: "sidebar",
    heroStyle: "editorial",
    iconStyle: "outline",
    fontFamily: "inter",
    cornerRadius: "sharp",
    previewImage: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 220 132'%3E%3Crect width='220' height='132' fill='%23111827'/%3E%3Crect x='18' y='20' width='88' height='74' fill='%23f59e0b' opacity='.18'/%3E%3Crect x='119' y='20' width='72' height='16' fill='%23f59e0b'/%3E%3Crect x='119' y='48' width='84' height='7' fill='%23ffffff' opacity='.72'/%3E%3Crect x='119' y='64' width='62' height='7' fill='%23ffffff' opacity='.35'/%3E%3Crect x='18' y='106' width='185' height='8' fill='%23f59e0b' opacity='.6'/%3E%3C/svg%3E",
  },
  {
    id: "vibrant",
    label: "Vibrant",
    labelAr: "نابض",
    description: "Bold color, centered hero and compact energetic grid",
    descriptionAr: "ألوان قوية وهيرو مركزي وشبكة منتجات سريعة",
    primaryColor: "#ec4899",
    secondaryColor: "#06b6d4",
    productGridStyle: "compact",
    filtersPlacement: "drawer",
    heroStyle: "centered",
    iconStyle: "solid",
    fontFamily: "cairo",
    cornerRadius: "rounded",
    previewImage: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 220 132'%3E%3Crect width='220' height='132' fill='%23fff'/%3E%3Ccircle cx='110' cy='44' r='36' fill='%23ec4899' opacity='.9'/%3E%3Ccircle cx='136' cy='55' r='26' fill='%2306b6d4' opacity='.78'/%3E%3Crect x='18' y='94' width='40' height='24' rx='12' fill='%23ec4899'/%3E%3Crect x='66' y='94' width='40' height='24' rx='12' fill='%2306b6d4'/%3E%3Crect x='114' y='94' width='40' height='24' rx='12' fill='%23ec4899'/%3E%3Crect x='162' y='94' width='40' height='24' rx='12' fill='%2306b6d4'/%3E%3C/svg%3E",
  },
  {
    id: "professional",
    label: "Professional",
    labelAr: "احترافي",
    description: "Corporate ecommerce layout with sidebar filters",
    descriptionAr: "شكل تجاري احترافي مع فلاتر جانبية",
    primaryColor: "#0369a1",
    secondaryColor: "#64748b",
    productGridStyle: "classic",
    filtersPlacement: "sidebar",
    heroStyle: "split",
    iconStyle: "duotone",
    fontFamily: "inter",
    cornerRadius: "soft",
    previewImage: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 220 132'%3E%3Crect width='220' height='132' fill='%23f8fafc'/%3E%3Crect x='15' y='18' width='190' height='24' rx='6' fill='%230369a1'/%3E%3Crect x='15' y='56' width='42' height='54' rx='6' fill='%23e2e8f0'/%3E%3Crect x='70' y='56' width='39' height='54' rx='6' fill='%23fff' stroke='%23cbd5e1'/%3E%3Crect x='119' y='56' width='39' height='54' rx='6' fill='%23fff' stroke='%23cbd5e1'/%3E%3Crect x='168' y='56' width='37' height='54' rx='6' fill='%23fff' stroke='%23cbd5e1'/%3E%3C/svg%3E",
  },
  {
    id: "minimal",
    label: "Minimal",
    labelAr: "مينيمال",
    description: "Fast simple shopping experience with sharp cards",
    descriptionAr: "تجربة شراء بسيطة وسريعة بكروت حادة",
    primaryColor: "#0f172a",
    secondaryColor: "#94a3b8",
    productGridStyle: "compact",
    filtersPlacement: "top",
    heroStyle: "centered",
    iconStyle: "outline",
    fontFamily: "system",
    cornerRadius: "sharp",
    previewImage: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 220 132'%3E%3Crect width='220' height='132' fill='%23ffffff'/%3E%3Crect x='42' y='26' width='136' height='12' fill='%230f172a'/%3E%3Crect x='68' y='47' width='84' height='6' fill='%2394a3b8'/%3E%3Crect x='26' y='82' width='46' height='36' fill='%23f8fafc' stroke='%23e2e8f0'/%3E%3Crect x='87' y='82' width='46' height='36' fill='%23f8fafc' stroke='%23e2e8f0'/%3E%3Crect x='148' y='82' width='46' height='36' fill='%23f8fafc' stroke='%23e2e8f0'/%3E%3C/svg%3E",
  },
  {
    id: "boutique",
    label: "Boutique",
    labelAr: "بوتيك",
    description: "Soft editorial hero, premium rounded cards and warm icons",
    descriptionAr: "هيرو تحريري ناعم وكروت مستديرة ولمسات دافئة",
    primaryColor: "#be123c",
    secondaryColor: "#fb7185",
    productGridStyle: "masonry",
    filtersPlacement: "drawer",
    heroStyle: "editorial",
    iconStyle: "solid",
    fontFamily: "tajawal",
    cornerRadius: "rounded",
    previewImage: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 220 132'%3E%3Crect width='220' height='132' fill='%23fff1f2'/%3E%3Crect x='18' y='18' width='118' height='62' rx='22' fill='%23be123c' opacity='.88'/%3E%3Crect x='150' y='24' width='42' height='42' rx='21' fill='%23fb7185' opacity='.45'/%3E%3Crect x='22' y='96' width='52' height='24' rx='12' fill='%23fff' stroke='%23fecdd3'/%3E%3Crect x='84' y='90' width='52' height='30' rx='15' fill='%23fff' stroke='%23fecdd3'/%3E%3Crect x='146' y='96' width='52' height='24' rx='12' fill='%23fff' stroke='%23fecdd3'/%3E%3C/svg%3E",
  },
];

export function getThemeById(id?: string | null): StoreTheme | undefined {
  return STORE_THEMES.find((theme) => theme.id === id);
}

export function getDefaultTheme(): StoreTheme {
  return STORE_THEMES[0]!;
}
