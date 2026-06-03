export interface StoreTheme {
  id: string;
  label: string;
  labelAr: string;
  description: string;
  descriptionAr: string;
  primaryColor: string;
  secondaryColor: string;
  previewImage?: string;
}

export const STORE_THEMES: StoreTheme[] = [
  {
    id: "modern",
    label: "Modern",
    labelAr: "عصري",
    description: "Clean and minimal with vibrant colors",
    descriptionAr: "تصميم نظيف وبسيط مع ألوان حيوية",
    primaryColor: "#f97316",
    secondaryColor: "#10b981",
    previewImage: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 120'%3E%3Crect width='200' height='120' fill='%23f5f5f5'/%3E%3Crect width='200' height='40' fill='%23f97316'/%3E%3Crect y='45' width='200' height='60' fill='%23ffffff' stroke='%23e5e5e5'/%3E%3Ccircle cx='50' cy='75' r='15' fill='%2310b981'/%3E%3Crect x='75' y='60' width='100' height='8' rx='4' fill='%23f97316'/%3E%3Crect x='75' y='72' width='80' height='5' rx='2.5' fill='%23d1d5db'/%3E%3C/svg%3E",
  },
  {
    id: "luxury",
    label: "Luxury",
    labelAr: "فاخر",
    description: "Elegant dark theme with gold accents",
    descriptionAr: "تصميم أنيق داكن مع لمسات ذهبية",
    primaryColor: "#1f2937",
    secondaryColor: "#fbbf24",
    previewImage: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 120'%3E%3Crect width='200' height='120' fill='%231f2937'/%3E%3Crect width='200' height='35' fill='%231f2937'/%3E%3Crect y='35' width='200' height='50' fill='%23111827'/%3E%3Crect y='88' width='200' height='32' fill='%231f2937'/%3E%3Crect x='10' y='50' width='80' height='30' fill='%23fbbf24' opacity='0.2'/%3E%3Ccircle cx='150' cy='75' r='12' fill='%23fbbf24'/%3E%3C/svg%3E",
  },
  {
    id: "vibrant",
    label: "Vibrant",
    labelAr: "نابض",
    description: "Bold and energetic with bright colors",
    descriptionAr: "جريء وحيوي مع ألوان زاهية",
    primaryColor: "#ec4899",
    secondaryColor: "#06b6d4",
    previewImage: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 120'%3E%3Crect width='200' height='120' fill='%23ffffff'/%3E%3Crect width='100' height='60' fill='%23ec4899'/%3E%3Crect x='100' width='100' height='60' fill='%2306b6d4'/%3E%3Crect y='60' width='100' height='60' fill='%2306b6d4'/%3E%3Crect x='100' y='60' width='100' height='60' fill='%23ec4899'/%3E%3C/svg%3E",
  },
  {
    id: "professional",
    label: "Professional",
    labelAr: "احترافي",
    description: "Business-focused with corporate colors",
    descriptionAr: "موجه للأعمال مع ألوان احترافية",
    primaryColor: "#0369a1",
    secondaryColor: "#64748b",
    previewImage: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 120'%3E%3Crect width='200' height='120' fill='%23f8fafc'/%3E%3Crect width='200' height='25' fill='%230369a1'/%3E%3Cg fill='%230369a1'%3E%3Crect x='15' y='40' width='45' height='5' rx='2.5'/%3E%3Crect x='70' y='40' width='45' height='5' rx='2.5'/%3E%3Crect x='125' y='40' width='60' height='5' rx='2.5'/%3E%3Crect x='15' y='52' width='170' height='50' rx='3' fill='%2364748b' opacity='0.1'/%3E%3C/g%3E%3C/svg%3E",
  },
];

export function getThemeById(id: string): StoreTheme | undefined {
  return STORE_THEMES.find((theme) => theme.id === id);
}

export function getDefaultTheme(): StoreTheme {
  return STORE_THEMES[0]!;
}
