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
import { getDefaultTheme } from "@/config/store-themes";

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

export function StoreSettingsPanel({ store, storeSlug, section }: Props) {
  const router = useRouter();
  const { locale } = useTranslation();
  const isAr = locale === "ar";
  const [saving, setSaving] = useState(false);

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
    themePreset: store.settings.themePreset ?? getDefaultTheme().id,
    primaryColor: store.settings.theme.primaryColor,
    secondaryColor: store.settings.theme.secondaryColor,
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
              onChange={(themeId, primaryColor, secondaryColor) => {
                setForm({
                  ...form,
                  themePreset: themeId,
                  primaryColor,
                  secondaryColor,
                });
              }}
              isAr={isAr}
            />
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
