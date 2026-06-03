import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { SettingsTabs } from "@/components/admin/settings-tabs";
import { getStoreSettingsAction } from "@/actions/stores";
import type { StoreSettingsData } from "@/components/admin/store-settings-panel";

export const metadata: Metadata = {
  title: "إعدادات المتجر | لوحة التحكم",
  description: "إدارة إعدادات وتخصيص متجرك",
};

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ storeSlug: string }>;
}

export default async function AdminSettingsPage({ params }: Props) {
  const { storeSlug } = await params;
  const result = await getStoreSettingsAction(storeSlug);

  if (!result.success || !result.data) {
    redirect("/dashboard");
  }

  const raw = result.data;
  const store: StoreSettingsData = {
    _id: String(raw._id),
    slug: String(raw.slug),
    name: String(raw.name ?? ""),
    nameEn: String(raw.nameEn ?? ""),
    description: String(raw.description ?? ""),
    descriptionEn: String(raw.descriptionEn ?? ""),
    shortBio: raw.shortBio ? String(raw.shortBio) : "",
    shortBioEn: raw.shortBioEn ? String(raw.shortBioEn) : "",
    logo: raw.logo ? String(raw.logo) : "",
    logoPublicId: raw.logoPublicId ? String(raw.logoPublicId) : "",
    coverImage: raw.coverImage ? String(raw.coverImage) : "",
    coverPublicId: raw.coverPublicId ? String(raw.coverPublicId) : "",
    coverImages: Array.isArray(raw.coverImages)
      ? raw.coverImages
          .map((image) => ({
            url: String((image as { url?: unknown }).url ?? ""),
            publicId: (image as { publicId?: unknown }).publicId ? String((image as { publicId?: unknown }).publicId) : "",
            alt: (image as { alt?: unknown }).alt ? String((image as { alt?: unknown }).alt) : "",
          }))
          .filter((image) => image.url)
          .slice(0, 3)
      : [],
    favicon: raw.favicon ? String(raw.favicon) : "",
    faviconPublicId: raw.faviconPublicId ? String(raw.faviconPublicId) : "",
    email: String(raw.email ?? ""),
    phone: raw.phone ? String(raw.phone) : "",
    address: raw.address ? String(raw.address) : "",
    isActive: Boolean(raw.isActive),
    settings: {
      currency: String((raw.settings as StoreSettingsData["settings"])?.currency ?? "EGP"),
      language: String((raw.settings as StoreSettingsData["settings"])?.language ?? "ar"),
      timezone: String((raw.settings as StoreSettingsData["settings"])?.timezone ?? "Africa/Cairo"),
      dateFormat: String((raw.settings as StoreSettingsData["settings"])?.dateFormat ?? "DD/MM/YYYY"),
      theme: {
        primaryColor: String((raw.settings as StoreSettingsData["settings"])?.theme?.primaryColor ?? "#f97316"),
        secondaryColor: String((raw.settings as StoreSettingsData["settings"])?.theme?.secondaryColor ?? "#10b981"),
      },
    },
    seo: raw.seo as StoreSettingsData["seo"],
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="إعدادات المتجر"
          description={`تخصيص متجر «${store.name}» — الشعار، الألوان، والبيانات`}
        />
        <Link
          href={`/${store.slug}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-lg border-2 border-orange-500 px-3 py-1.5 text-sm font-medium text-orange-600 hover:bg-orange-50 transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          معاينة المتجر
        </Link>
      </div>
      <SettingsTabs store={store} storeSlug={storeSlug} />
    </div>
  );
}
