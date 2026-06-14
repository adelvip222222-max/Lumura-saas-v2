"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/use-translation";
import { updateStoreAction } from "@/actions/stores";
import { cn } from "@/lib/utils";
import { ThemePresetSelector } from "@/components/admin/theme-preset-selector";
import {
  getDefaultTheme,
  type FiltersPlacement,
  type HeroStyle,
  type IconStyle,
  type ProductGridStyle,
  type StoreFont,
  type StoreRadius,
} from "@/config/store-themes";

export interface StoreSettingsData {
  _id: string;
  slug: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  shortBio?: string;
  shortBioEn?: string;
  logo?: string;
  logoPublicId?: string;
  coverImage?: string;
  coverPublicId?: string;
  coverImages?: Array<{ url: string; publicId?: string; alt?: string }>;
  favicon?: string;
  faviconPublicId?: string;
  email: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  settings: {
    currency: string;
    language: string;
    timezone: string;
    dateFormat: string;
    themePreset?: string;
    productGridStyle?: ProductGridStyle;
    filtersPlacement?: FiltersPlacement;
    heroStyle?: HeroStyle;
    iconStyle?: IconStyle;
    fontFamily?: StoreFont;
    cornerRadius?: StoreRadius;
    theme: { primaryColor: string; secondaryColor: string };
  };
  seo?: {
    title?: string;
    titleEn?: string;
    description?: string;
    descriptionEn?: string;
    keywords?: string[];
  };
}

export type StoreSettingsSection = "general" | "media" | "appearance" | "contact" | "seo";

interface Props {
  store: StoreSettingsData;
  storeSlug: string;
  section: StoreSettingsSection;
}

async function uploadImage(file: File, type: string, storeSlug: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);
  formData.append("storeSlug", storeSlug);
  const res = await fetch("/upload", { method: "POST", body: formData });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Upload failed");
  return json as { url: string; publicId: string };
}

async function deleteUploadedImage(publicId: string) {
  await fetch(`/upload?publicId=${encodeURIComponent(publicId)}`, { method: "DELETE" });
}

function ImageUploadField({
  label,
  hint,
  value,
  publicId,
  type,
  storeSlug,
  aspect = "square",
  onChange,
}: {
  label: string;
  hint?: string;
  value?: string;
  publicId?: string;
  type: "logo" | "cover" | "favicon";
  storeSlug: string;
  aspect?: "square" | "cover";
  onChange: (url: string, publicId?: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const result = await uploadImage(file, type, storeSlug);
      onChange(result.url, result.publicId);
      toast.success("تم رفع الصورة");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل رفع الصورة");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border-2 border-dashed bg-muted/30 flex items-center justify-center",
          aspect === "cover" ? "h-36 w-full" : "h-28 w-28"
        )}
      >
        {value ? (
          <>
            <img src={value} alt={label} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={async () => {
                if (publicId) {
                  try {
                    await deleteUploadedImage(publicId);
                  } catch {
                    /* تجاهل — سيُزال من DB عند الحفظ */
                  }
                }
                onChange("", undefined);
              }}
              className="absolute top-1 left-1 rounded-full bg-destructive p-1 text-white shadow"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        ) : (
          <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-3.5 w-3.5 ml-1" />
        {value ? "تغيير الصورة" : "رفع صورة"}
      </Button>
    </div>
  );
}

const textareaClass =
  "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type DesignOption<T extends string> = { value: T; labelAr: string; labelEn: string; descriptionAr: string; descriptionEn: string };

const PRODUCT_GRID_OPTIONS: DesignOption<ProductGridStyle>[] = [
  { value: "classic", labelAr: "كلاسيك", labelEn: "Classic", descriptionAr: "كروت واضحة بأبعاد ثابتة مناسبة لمعظم المتاجر", descriptionEn: "Balanced product cards for most stores" },
  { value: "compact", labelAr: "مضغوط", labelEn: "Compact", descriptionAr: "يعرض منتجات أكثر في الشاشة ويقلل الفراغات", descriptionEn: "Shows more products with tighter spacing" },
  { value: "editorial", labelAr: "تحريري", labelEn: "Editorial", descriptionAr: "شكل فاخر بصور أكبر واهتمام بالمنتج", descriptionEn: "Premium editorial cards with larger imagery" },
  { value: "masonry", labelAr: "بوتيك", labelEn: "Boutique", descriptionAr: "كروت ناعمة مستديرة مناسبة للموضة والهدايا", descriptionEn: "Soft boutique cards for fashion and gifts" },
];

const FILTERS_OPTIONS: DesignOption<FiltersPlacement>[] = [
  { value: "top", labelAr: "فلاتر أعلى المنتجات", labelEn: "Top filters", descriptionAr: "مناسب للمتاجر الصغيرة والمتوسطة", descriptionEn: "Good for small and medium catalogs" },
  { value: "sidebar", labelAr: "فلاتر جانبية", labelEn: "Sidebar filters", descriptionAr: "أفضل للمتاجر كثيرة الفئات", descriptionEn: "Best for larger catalogs" },
  { value: "drawer", labelAr: "زر فلاتر للموبايل", labelEn: "Mobile drawer", descriptionAr: "واجهة هادئة مع إبراز المنتجات", descriptionEn: "Cleaner storefront with product focus" },
];

const HERO_OPTIONS: DesignOption<HeroStyle>[] = [
  { value: "split", labelAr: "هيرو منقسم", labelEn: "Split hero", descriptionAr: "نص واضح بجانب سلايدر الصور", descriptionEn: "Text beside image slider" },
  { value: "centered", labelAr: "هيرو مركزي", labelEn: "Centered hero", descriptionAr: "عنوان في المنتصف مع دعوة شراء مباشرة", descriptionEn: "Centered headline and CTAs" },
  { value: "editorial", labelAr: "هيرو تحريري", labelEn: "Editorial hero", descriptionAr: "إحساس فاخر بكتل صور وألوان", descriptionEn: "Premium magazine-like intro" },
];

const ICON_OPTIONS: DesignOption<IconStyle>[] = [
  { value: "outline", labelAr: "أيقونات خطية", labelEn: "Outline", descriptionAr: "خفيفة وبسيطة", descriptionEn: "Light and minimal" },
  { value: "solid", labelAr: "أيقونات ممتلئة", labelEn: "Solid", descriptionAr: "واضحة وجريئة", descriptionEn: "Bold and visible" },
  { value: "duotone", labelAr: "أيقونات ثنائية", labelEn: "Duotone", descriptionAr: "لمسة SaaS حديثة", descriptionEn: "Modern SaaS feel" },
];

const FONT_OPTIONS: DesignOption<StoreFont>[] = [
  { value: "system", labelAr: "افتراضي سريع", labelEn: "System", descriptionAr: "الأسرع والأكثر توافقًا", descriptionEn: "Fastest and safest" },
  { value: "cairo", labelAr: "Cairo", labelEn: "Cairo", descriptionAr: "ممتاز للعربية والمتاجر المحلية", descriptionEn: "Great for Arabic storefronts" },
  { value: "tajawal", labelAr: "Tajawal", labelEn: "Tajawal", descriptionAr: "ناعم ومناسب للموضة", descriptionEn: "Soft and boutique friendly" },
  { value: "inter", labelAr: "Inter", labelEn: "Inter", descriptionAr: "احترافي ومناسب للإنجليزية", descriptionEn: "Professional Latin UI" },
];

const RADIUS_OPTIONS: DesignOption<StoreRadius>[] = [
  { value: "sharp", labelAr: "حاد", labelEn: "Sharp", descriptionAr: "مظهر فاخر ورسمي", descriptionEn: "Premium sharp look" },
  { value: "soft", labelAr: "ناعم", labelEn: "Soft", descriptionAr: "متوازن لمعظم المتاجر", descriptionEn: "Balanced default" },
  { value: "rounded", labelAr: "مستدير", labelEn: "Rounded", descriptionAr: "ودود ومناسب للعروض", descriptionEn: "Friendly playful feel" },
];

export function StoreSettingsPanel({ store, storeSlug, section }: Props) {
  const router = useRouter();
  const { locale } = useTranslation();
  const isAr = locale === "ar";
  const [saving, setSaving] = useState(false);
  const defaultTheme = getDefaultTheme();

  const [form, setForm] = useState({
    name: store.name,
    nameEn: store.nameEn,
    slug: store.slug,
    description: store.description,
    descriptionEn: store.descriptionEn,
    shortBio: store.shortBio ?? "",
    shortBioEn: store.shortBioEn ?? "",
    logo: store.logo ?? "",
    logoPublicId: store.logoPublicId ?? "",
    coverImage: store.coverImage ?? "",
    coverPublicId: store.coverPublicId ?? "",
    coverImages:
      store.coverImages?.length
        ? store.coverImages.slice(0, 3)
        : store.coverImage
          ? [{ url: store.coverImage, publicId: store.coverPublicId ?? "", alt: "" }]
          : [],
    favicon: store.favicon ?? "",
    faviconPublicId: store.faviconPublicId ?? "",
    dateFormat: store.settings.dateFormat ?? "DD/MM/YYYY",
    email: store.email,
    phone: store.phone ?? "",
    address: store.address ?? "",
    isActive: store.isActive,
    currency: store.settings.currency,
    language: store.settings.language as "ar" | "en",
    timezone: store.settings.timezone,
    themePreset: store.settings.themePreset ?? defaultTheme.id,
    productGridStyle: (store.settings.productGridStyle ?? defaultTheme.productGridStyle) as ProductGridStyle,
    filtersPlacement: (store.settings.filtersPlacement ?? defaultTheme.filtersPlacement) as FiltersPlacement,
    heroStyle: (store.settings.heroStyle ?? defaultTheme.heroStyle) as HeroStyle,
    iconStyle: (store.settings.iconStyle ?? defaultTheme.iconStyle) as IconStyle,
    fontFamily: (store.settings.fontFamily ?? defaultTheme.fontFamily) as StoreFont,
    cornerRadius: (store.settings.cornerRadius ?? defaultTheme.cornerRadius) as StoreRadius,
    primaryColor: store.settings.theme.primaryColor || defaultTheme.primaryColor,
    secondaryColor: store.settings.theme.secondaryColor || defaultTheme.secondaryColor,
    seoTitle: store.seo?.title ?? "",
    seoTitleEn: store.seo?.titleEn ?? "",
    seoDescription: store.seo?.description ?? "",
    seoDescriptionEn: store.seo?.descriptionEn ?? "",
    seoKeywords: (store.seo?.keywords ?? []).join(", "),
  });

  const appUrl = typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        storeId: store._id,
      };

      if (section === "general") {
        Object.assign(payload, {
          name: form.name,
          nameEn: form.nameEn,
          slug: form.slug,
          description: form.description,
          descriptionEn: form.descriptionEn,
          shortBio: form.shortBio,
          shortBioEn: form.shortBioEn,
          isActive: form.isActive,
          settings: {
            currency: form.currency,
            language: form.language,
            timezone: form.timezone,
            dateFormat: form.dateFormat,
          },
        });
      }

      if (section === "media") {
        const coverImages = form.coverImages.filter((image) => image.url).slice(0, 3);
        Object.assign(payload, {
          logo: form.logo,
          logoPublicId: form.logoPublicId || undefined,
          coverImage: coverImages[0]?.url ?? form.coverImage,
          coverPublicId: coverImages[0]?.publicId || form.coverPublicId || undefined,
          coverImages,
          favicon: form.favicon,
          faviconPublicId: form.faviconPublicId || undefined,
        });
      }

      if (section === "appearance") {
        Object.assign(payload, {
          settings: {
            themePreset: form.themePreset,
            productGridStyle: form.productGridStyle,
            filtersPlacement: form.filtersPlacement,
            heroStyle: form.heroStyle,
            iconStyle: form.iconStyle,
            fontFamily: form.fontFamily,
            cornerRadius: form.cornerRadius,
            theme: {
              primaryColor: form.primaryColor,
              secondaryColor: form.secondaryColor,
            },
          },
        });
      }

      if (section === "contact") {
        Object.assign(payload, {
          email: form.email,
          phone: form.phone,
          address: form.address,
        });
      }

      if (section === "seo") {
        Object.assign(payload, {
          seo: {
            title: form.seoTitle,
            titleEn: form.seoTitleEn,
            description: form.seoDescription,
            descriptionEn: form.seoDescriptionEn,
            keywords: form.seoKeywords
              .split(",")
              .map((k) => k.trim())
              .filter(Boolean),
          },
        });
      }

      const result = await updateStoreAction(payload);
      if (!result.success) {
        toast.error(result.error ?? "فشل الحفظ");
        return;
      }

      toast.success(isAr ? "تم حفظ إعدادات المتجر" : "Store settings saved");
      router.refresh();
    } catch {
      toast.error(isAr ? "حدث خطأ" : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (section === "general") {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{isAr ? "معلومات المتجر" : "Store Information"}</CardTitle>
            <CardDescription>
              {isAr ? "الاسم والنبذة والوصف الظاهر للعملاء" : "Name, bio and description shown to customers"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{isAr ? "اسم المتجر (عربي)" : "Store Name (Arabic)"}</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} dir="rtl" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{isAr ? "اسم المتجر (English)" : "Store Name (English)"}</label>
                <Input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} dir="ltr" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{isAr ? "رابط المتجر (slug)" : "Store URL slug"}</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground shrink-0">{appUrl}/</span>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                  className="font-mono"
                  dir="ltr"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{isAr ? "نبذة مختصرة (عربي)" : "Short bio (Arabic)"}</label>
                <textarea
                  value={form.shortBio}
                  onChange={(e) => setForm({ ...form, shortBio: e.target.value })}
                  rows={2}
                  maxLength={200}
                  className={textareaClass}
                  dir="rtl"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{isAr ? "نبذة مختصرة (English)" : "Short bio (English)"}</label>
                <textarea
                  value={form.shortBioEn}
                  onChange={(e) => setForm({ ...form, shortBioEn: e.target.value })}
                  rows={2}
                  maxLength={200}
                  className={textareaClass}
                  dir="ltr"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{isAr ? "وصف المتجر (عربي)" : "Description (Arabic)"}</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className={textareaClass}
                dir="rtl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{isAr ? "وصف المتجر (English)" : "Description (English)"}</label>
              <textarea
                value={form.descriptionEn}
                onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
                rows={4}
                className={textareaClass}
                dir="ltr"
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer rounded-lg border p-3 hover:bg-muted/50">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4 accent-primary"
              />
              <div>
                <p className="text-sm font-medium">{isAr ? "المتجر نشط" : "Store is active"}</p>
                <p className="text-xs text-muted-foreground">
                  {isAr ? "عند الإيقاف لن يظهر المتجر للعملاء" : "When off, store is hidden from customers"}
                </p>
              </div>
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{isAr ? "العملة واللغة" : "Currency & Language"}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{isAr ? "العملة" : "Currency"}</label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className={textareaClass}
              >
                <option value="EGP">EGP — جنيه مصري</option>
                <option value="USD">USD — دولار</option>
                <option value="SAR">SAR — ريال سعودي</option>
                <option value="AED">AED — درهم إماراتي</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{isAr ? "لغة المتجر" : "Store language"}</label>
              <select
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value as "ar" | "en" })}
                className={textareaClass}
              >
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{isAr ? "المنطقة الزمنية" : "Timezone"}</label>
              <select
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                className={textareaClass}
              >
                <option value="Africa/Cairo">Africa/Cairo</option>
                <option value="Asia/Riyadh">Asia/Riyadh</option>
                <option value="Asia/Dubai">Asia/Dubai</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{isAr ? "تنسيق التاريخ" : "Date format"}</label>
              <select
                value={form.dateFormat}
                onChange={(e) => setForm({ ...form, dateFormat: e.target.value })}
                className={textareaClass}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <SaveButton saving={saving} onSave={handleSave} isAr={isAr} />
      </div>
    );
  }

  if (section === "media") {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{isAr ? "الصور والشعار" : "Images & Logo"}</CardTitle>
            <CardDescription>
              {isAr ? "شعار المتجر وصورة الغلاف والأيقونة" : "Store logo, cover image and favicon"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <ImageUploadField
                label={isAr ? "شعار المتجر (Logo)" : "Store Logo"}
                hint={isAr ? "يُفضّل 400×400 بكسل — PNG شفاف" : "Recommended 400×400px"}
                value={form.logo}
                publicId={form.logoPublicId}
                type="logo"
                storeSlug={storeSlug}
                onChange={(url, pid) =>
                  setForm({
                    ...form,
                    logo: url,
                    logoPublicId: pid ?? (url ? form.logoPublicId : ""),
                  })
                }
              />
              <ImageUploadField
                label={isAr ? "أيقونة المتجر (Favicon)" : "Favicon"}
                hint={isAr ? "64×64 — تبويب المتصفح" : "64×64 browser tab icon"}
                value={form.favicon}
                publicId={form.faviconPublicId}
                type="favicon"
                storeSlug={storeSlug}
                onChange={(url, pid) =>
                  setForm({
                    ...form,
                    favicon: url,
                    faviconPublicId: pid ?? (url ? form.faviconPublicId : ""),
                  })
                }
              />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">{isAr ? "صور الغلاف الرئيسية" : "Cover Slider Images"}</p>
                <p className="text-xs text-muted-foreground">
                  {isAr ? "حتى 3 صور للسلايدر — 1600×600" : "Up to 3 slider images — 1600×600"}
                </p>
              </div>
              {form.coverImages.length > 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {form.coverImages.map((image, index) => (
                    <div key={`${image.url}-${index}`} className="relative overflow-hidden rounded-xl border bg-muted">
                      <img src={image.url} alt="" className="h-28 w-full object-cover" />
                      <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
                        {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const next = form.coverImages.filter((_, itemIndex) => itemIndex !== index);
                          setForm({
                            ...form,
                            coverImages: next,
                            coverImage: next[0]?.url ?? "",
                            coverPublicId: next[0]?.publicId ?? "",
                          });
                        }}
                        className="absolute top-2 left-2 rounded-full bg-destructive p-1 text-white shadow"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {form.coverImages.length < 3 && (
                <ImageUploadField
                  label={isAr ? "إضافة صورة غلاف" : "Add Cover Image"}
                  value=""
                  type="cover"
                  storeSlug={storeSlug}
                  aspect="cover"
                  onChange={(url, pid) => {
                    const next = [...form.coverImages, { url, publicId: pid ?? "", alt: "" }].slice(0, 3);
                    setForm({
                      ...form,
                      coverImages: next,
                      coverImage: next[0]?.url ?? "",
                      coverPublicId: next[0]?.publicId ?? "",
                    });
                  }}
                />
              )}
            </div>
          </CardContent>
        </Card>
        <SaveButton saving={saving} onSave={handleSave} isAr={isAr} />
      </div>
    );
  }

  if (section === "appearance") {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{isAr ? "اختر تصميماً جاهزاً" : "Store Design Templates"}</CardTitle>
            <CardDescription>
              {isAr ? "اختر من بين عدة تصاميم جاهزة جميلة لمتجرك" : "Choose a beautiful pre-designed theme for your store"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ThemePresetSelector
              value={form.themePreset}
              onChange={(theme) => {
                setForm({
                  ...form,
                  themePreset: theme.id,
                  productGridStyle: theme.productGridStyle,
                  filtersPlacement: theme.filtersPlacement,
                  heroStyle: theme.heroStyle,
                  iconStyle: theme.iconStyle,
                  fontFamily: theme.fontFamily,
                  cornerRadius: theme.cornerRadius,
                  primaryColor: theme.primaryColor,
                  secondaryColor: theme.secondaryColor,
                });
              }}
              isAr={isAr}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{isAr ? "تفاصيل شكل الواجهة" : "Storefront Layout Details"}</CardTitle>
            <CardDescription>
              {isAr
                ? "تحكم في شكل شبكة المنتجات، مكان الفلاتر، الهيرو، الأيقونات، الفونت، واستدارة الكروت"
                : "Control product grid, filters position, hero, icons, font and card radius"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <DesignChoiceGrid
              title={isAr ? "شكل شبكة المنتجات" : "Product grid style"}
              options={PRODUCT_GRID_OPTIONS}
              value={form.productGridStyle}
              isAr={isAr}
              onChange={(value) => setForm({ ...form, productGridStyle: value })}
            />
            <DesignChoiceGrid
              title={isAr ? "مكان الفلاتر" : "Filters placement"}
              options={FILTERS_OPTIONS}
              value={form.filtersPlacement}
              isAr={isAr}
              onChange={(value) => setForm({ ...form, filtersPlacement: value })}
            />
            <DesignChoiceGrid
              title={isAr ? "شكل الهيرو سكشن" : "Hero section style"}
              options={HERO_OPTIONS}
              value={form.heroStyle}
              isAr={isAr}
              onChange={(value) => setForm({ ...form, heroStyle: value })}
            />
            <div className="grid gap-6 lg:grid-cols-3">
              <DesignChoiceGrid
                title={isAr ? "شكل الأيقونات" : "Icon style"}
                options={ICON_OPTIONS}
                value={form.iconStyle}
                isAr={isAr}
                onChange={(value) => setForm({ ...form, iconStyle: value })}
              />
              <DesignChoiceGrid
                title={isAr ? "الفونت" : "Font"}
                options={FONT_OPTIONS}
                value={form.fontFamily}
                isAr={isAr}
                onChange={(value) => setForm({ ...form, fontFamily: value })}
              />
              <DesignChoiceGrid
                title={isAr ? "استدارة العناصر" : "Corner radius"}
                options={RADIUS_OPTIONS}
                value={form.cornerRadius}
                isAr={isAr}
                onChange={(value) => setForm({ ...form, cornerRadius: value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{isAr ? "ألوان المتجر المخصصة" : "Custom Store Colors"}</CardTitle>
            <CardDescription>
              {isAr ? "يمكنك تخصيص الألوان بعد اختيار التصميم الجاهز" : "Customize colors after selecting a template"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <ColorField
                label={isAr ? "اللون الأساسي" : "Primary Color"}
                value={form.primaryColor}
                onChange={(v) => setForm({ ...form, primaryColor: v })}
              />
              <ColorField
                label={isAr ? "اللون الثانوي" : "Secondary Color"}
                value={form.secondaryColor}
                onChange={(v) => setForm({ ...form, secondaryColor: v })}
              />
            </div>
            <div className="rounded-xl border p-4 space-y-3">
              <p className="text-sm font-medium">{isAr ? "معاينة" : "Preview"}</p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  style={{ backgroundColor: form.primaryColor }}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-white shadow"
                >
                  {isAr ? "زر أساسي" : "Primary Button"}
                </button>
                <button
                  type="button"
                  style={{ backgroundColor: form.secondaryColor }}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-white shadow"
                >
                  {isAr ? "زر ثانوي" : "Secondary Button"}
                </button>
                <Badge style={{ backgroundColor: form.primaryColor, color: "#fff" }}>
                  {form.name}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <SaveButton saving={saving} onSave={handleSave} isAr={isAr} />
      </div>
    );
  }

  if (section === "contact") {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{isAr ? "معلومات التواصل" : "Contact Information"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{isAr ? "البريد الإلكتروني" : "Email"}</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{isAr ? "رقم الهاتف" : "Phone"}</label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                dir="ltr"
                placeholder="+20..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{isAr ? "العنوان" : "Address"}</label>
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                rows={3}
                className={textareaClass}
              />
            </div>
          </CardContent>
        </Card>
        <SaveButton saving={saving} onSave={handleSave} isAr={isAr} />
      </div>
    );
  }

  // seo
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{isAr ? "تحسين محركات البحث (SEO)" : "Search Engine Optimization"}</CardTitle>
          <CardDescription>
            {isAr ? "عناوين ووصف المتجر في نتائج البحث" : "Titles and descriptions in search results"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{isAr ? "عنوان SEO (عربي)" : "SEO Title (Arabic)"}</label>
              <Input value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} maxLength={120} dir="rtl" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{isAr ? "عنوان SEO (English)" : "SEO Title (English)"}</label>
              <Input value={form.seoTitleEn} onChange={(e) => setForm({ ...form, seoTitleEn: e.target.value })} maxLength={120} dir="ltr" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{isAr ? "وصف SEO (عربي)" : "SEO Description (Arabic)"}</label>
            <textarea
              value={form.seoDescription}
              onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
              rows={2}
              maxLength={300}
              className={textareaClass}
              dir="rtl"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{isAr ? "وصف SEO (English)" : "SEO Description (English)"}</label>
            <textarea
              value={form.seoDescriptionEn}
              onChange={(e) => setForm({ ...form, seoDescriptionEn: e.target.value })}
              rows={2}
              maxLength={300}
              className={textareaClass}
              dir="ltr"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{isAr ? "الكلمات المفتاحية" : "Keywords"}</label>
            <Input
              value={form.seoKeywords}
              onChange={(e) => setForm({ ...form, seoKeywords: e.target.value })}
              placeholder={isAr ? "متجر, إلكتروني, ملابس" : "store, ecommerce, fashion"}
            />
            <p className="text-xs text-muted-foreground">{isAr ? "افصل بين الكلمات بفاصلة" : "Separate with commas"}</p>
          </div>
        </CardContent>
      </Card>
      <SaveButton saving={saving} onSave={handleSave} isAr={isAr} />
    </div>
  );
}

function DesignChoiceGrid<T extends string>({
  title,
  options,
  value,
  isAr,
  onChange,
}: {
  title: string;
  options: DesignOption<T>[];
  value: T;
  isAr: boolean;
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">{title}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "rounded-xl border p-3 text-start transition hover:bg-muted/60",
                selected ? "border-primary bg-primary/5 shadow-sm" : "border-border"
              )}
            >
              <span className="text-sm font-semibold">{isAr ? option.labelAr : option.labelEn}</span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                {isAr ? option.descriptionAr : option.descriptionEn}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-14 cursor-pointer rounded border p-0.5"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono uppercase"
          maxLength={7}
          dir="ltr"
        />
        <div className="h-10 w-10 shrink-0 rounded-lg border shadow-inner" style={{ backgroundColor: value }} />
      </div>
    </div>
  );
}

function SaveButton({
  saving,
  onSave,
  isAr,
}: {
  saving: boolean;
  onSave: () => void;
  isAr: boolean;
}) {
  return (
    <Button onClick={onSave} loading={saving} size="lg">
      {isAr ? "حفظ التغييرات" : "Save Changes"}
    </Button>
  );
}
