"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Globe,
  Palette,
  User,
  Shield,
  Bell,
  Store,
  Sun,
  Moon,
  Monitor,
  Check,
  ImageIcon,
  Phone,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useTranslation } from "@/hooks/use-translation";
import { updateProfileAction, changePasswordAction } from "@/actions/auth";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import {
  StoreSettingsPanel,
  type StoreSettingsData,
} from "@/components/admin/store-settings-panel";

// ─── Tab definitions ──────────────────────────────────────────────────────────
const BASE_TABS = [
  { id: "general",       label: "General",       labelAr: "عام",              icon: Store   },
  { id: "media",         label: "Media",         labelAr: "الصور",            icon: ImageIcon },
  { id: "appearance",    label: "Appearance",    labelAr: "المظهر",           icon: Palette },
  { id: "contact",       label: "Contact",       labelAr: "التواصل",          icon: Phone   },
  { id: "seo",           label: "SEO",           labelAr: "SEO",              icon: Search  },
  { id: "language",      label: "Language",      labelAr: "اللغة",            icon: Globe   },
  { id: "profile",       label: "Profile",       labelAr: "الملف الشخصي",     icon: User    },
  { id: "security",      label: "Security",      labelAr: "الأمان",           icon: Shield  },
  { id: "notifications", label: "Notifications", labelAr: "الإشعارات",        icon: Bell    },
] as const;

type TabId = (typeof BASE_TABS)[number]["id"];

// ─── General Tab (fallback when no store context) ────────────────────────────
function GeneralTabFallback() {
  const { locale } = useTranslation();
  const isAr = locale === "ar";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isAr ? "معلومات المتجر" : "Store Information"}
          </CardTitle>
          <CardDescription>
            {isAr ? "المعلومات الأساسية لمتجرك" : "Basic information about your store"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {isAr ? "اسم المتجر" : "Store Name"}
              </label>
              <Input defaultValue={siteConfig.name} readOnly className="bg-muted/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {isAr ? "رابط المتجر" : "Store URL"}
              </label>
              <Input defaultValue={siteConfig.url} readOnly className="bg-muted/50" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {isAr ? "وصف المتجر" : "Store Description"}
            </label>
            <textarea
              defaultValue={siteConfig.description}
              readOnly
              rows={2}
              className="flex w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isAr ? "إعدادات العملة" : "Currency Settings"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {isAr ? "رمز العملة" : "Currency Code"}
              </label>
              <Input defaultValue={siteConfig.currency?.code || "EGP"} readOnly className="bg-muted/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {isAr ? "رمز العملة" : "Currency Symbol"}
              </label>
              <Input defaultValue={siteConfig.currency?.symbol || "£"} readOnly className="bg-muted/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {isAr ? "نسبة الضريبة" : "Tax Rate"}
              </label>
              <Input defaultValue={`${(siteConfig.tax?.rate ?? 0.14) * 100}%`} readOnly className="bg-muted/50" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isAr ? "إعدادات الشحن" : "Shipping Settings"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {isAr ? "حد الشحن المجاني" : "Free Shipping Threshold"}
              </label>
              <Input defaultValue={`$${siteConfig.shipping.freeThreshold}`} readOnly className="bg-muted/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {isAr ? "سعر الشحن الافتراضي" : "Default Shipping Rate"}
              </label>
              <Input defaultValue={`$${siteConfig.shipping.defaultRate}`} readOnly className="bg-muted/50" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Appearance Tab ───────────────────────────────────────────────────────────
function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  const { locale } = useTranslation();
  const isAr = locale === "ar";

  const themes = [
    { id: "light",  label: isAr ? "فاتح"   : "Light",  icon: Sun     },
    { id: "dark",   label: isAr ? "داكن"   : "Dark",   icon: Moon    },
    { id: "system", label: isAr ? "تلقائي" : "System", icon: Monitor },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isAr ? "مظهر لوحة التحكم" : "Dashboard Theme"}
          </CardTitle>
          <CardDescription>
            {isAr ? "اختر مظهر لوحة التحكم" : "Choose your preferred dashboard theme"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  "relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all hover:bg-muted/50",
                  theme === t.id
                    ? "border-primary bg-primary/5"
                    : "border-border"
                )}
              >
                {theme === t.id && (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </span>
                )}
                <div className={cn(
                  "rounded-full p-3",
                  theme === t.id ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  <t.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Color preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isAr ? "معاينة الألوان" : "Color Preview"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: isAr ? "أساسي" : "Primary",     cls: "bg-primary" },
              { label: isAr ? "ثانوي" : "Secondary",   cls: "bg-secondary border" },
              { label: isAr ? "خلفية" : "Background",  cls: "bg-background border" },
              { label: isAr ? "خطأ" : "Destructive",   cls: "bg-destructive" },
            ].map((color) => (
              <div key={color.label} className="space-y-2">
                <div className={cn("h-12 rounded-lg", color.cls)} />
                <p className="text-xs text-center text-muted-foreground">{color.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Language Tab ─────────────────────────────────────────────────────────────
function LanguageTab() {
  const { locale, setLocale, isRTL } = useTranslation();
  const isAr = locale === "ar";

  const languages = [
    {
      code: "en" as const,
      name: "English",
      nameNative: "English",
      flag: "🇺🇸",
      dir: "ltr",
      description: "Left-to-right layout",
    },
    {
      code: "ar" as const,
      name: "Arabic",
      nameNative: "العربية",
      flag: "🇸🇦",
      dir: "rtl",
      description: "تخطيط من اليمين إلى اليسار",
    },
  ];

  const handleChange = (code: "en" | "ar") => {
    setLocale(code);
    toast.success(
      code === "ar" ? "تم تغيير اللغة إلى العربية" : "Language changed to English"
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isAr ? "اختر اللغة" : "Select Language"}
          </CardTitle>
          <CardDescription>
            {isAr
              ? "اختر لغة واجهة المستخدم. سيتم تطبيق التغيير فوراً."
              : "Choose your interface language. Changes apply immediately."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleChange(lang.code)}
              className={cn(
                "w-full flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all hover:bg-muted/50",
                locale === lang.code
                  ? "border-primary bg-primary/5"
                  : "border-border"
              )}
            >
              <span className="text-3xl">{lang.flag}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{lang.nameNative}</p>
                  <span className="text-xs text-muted-foreground">({lang.name})</span>
                  <Badge variant="outline" className="text-xs">{lang.dir.toUpperCase()}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{lang.description}</p>
              </div>
              {locale === lang.code && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Current state info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isAr ? "الإعدادات الحالية" : "Current Settings"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {[
            {
              label: isAr ? "اللغة" : "Language",
              value: locale === "ar" ? "العربية (Arabic)" : "English",
            },
            {
              label: isAr ? "اتجاه النص" : "Text Direction",
              value: isRTL ? "RTL (يمين إلى يسار)" : "LTR (Left to Right)",
            },
            {
              label: isAr ? "الخط" : "Font",
              value: isRTL ? "Noto Sans Arabic" : "Inter",
            },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────
function ProfileTab() {
  const { data: session, update } = useSession();
  const { locale } = useTranslation();
  const isAr = locale === "ar";
  const [name, setName] = useState(session?.user?.name ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateProfileAction({ name });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      await update({ name });
      toast.success(isAr ? "تم تحديث الملف الشخصي" : "Profile updated successfully");
    } catch {
      toast.error(isAr ? "حدث خطأ" : "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isAr ? "معلومات الحساب" : "Account Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
              {(session?.user?.name ?? "A").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold">{session?.user?.name}</p>
              <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
              <Badge variant="outline" className="mt-1 capitalize text-xs">
                {session?.user?.role}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {isAr ? "الاسم الكامل" : "Full Name"}
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isAr ? "أدخل اسمك" : "Enter your name"}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {isAr ? "البريد الإلكتروني" : "Email Address"}
            </label>
            <Input
              value={session?.user?.email ?? ""}
              readOnly
              className="bg-muted/50"
            />
            <p className="text-xs text-muted-foreground">
              {isAr ? "لا يمكن تغيير البريد الإلكتروني" : "Email cannot be changed"}
            </p>
          </div>

          <Button onClick={handleSave} loading={isSaving}>
            {isAr ? "حفظ التغييرات" : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Security Tab ─────────────────────────────────────────────────────────────
function SecurityTab() {
  const { locale } = useTranslation();
  const isAr = locale === "ar";
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleChangePassword = async () => {
    if (newPw !== confirmPw) {
      toast.error(isAr ? "كلمتا المرور غير متطابقتين" : "Passwords do not match");
      return;
    }
    if (newPw.length < 8) {
      toast.error(isAr ? "كلمة المرور قصيرة جداً" : "Password too short");
      return;
    }

    setIsSaving(true);
    try {
      const result = await changePasswordAction({
        currentPassword: currentPw,
        newPassword: newPw,
        confirmPassword: confirmPw,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(isAr ? "تم تغيير كلمة المرور" : "Password changed successfully");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch {
      toast.error(isAr ? "حدث خطأ" : "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isAr ? "تغيير كلمة المرور" : "Change Password"}
          </CardTitle>
          <CardDescription>
            {isAr
              ? "استخدم كلمة مرور قوية لحماية حسابك"
              : "Use a strong password to protect your account"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {isAr ? "كلمة المرور الحالية" : "Current Password"}
            </label>
            <Input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {isAr ? "كلمة المرور الجديدة" : "New Password"}
            </label>
            <Input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {isAr ? "تأكيد كلمة المرور" : "Confirm New Password"}
            </label>
            <Input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {/* Password strength hints */}
          <div className="rounded-lg bg-muted/50 p-3 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              {isAr ? "متطلبات كلمة المرور:" : "Password requirements:"}
            </p>
            {[
              { label: isAr ? "8 أحرف على الأقل" : "At least 8 characters", ok: newPw.length >= 8 },
              { label: isAr ? "حرف كبير" : "Uppercase letter", ok: /[A-Z]/.test(newPw) },
              { label: isAr ? "حرف صغير" : "Lowercase letter", ok: /[a-z]/.test(newPw) },
              { label: isAr ? "رقم" : "Number", ok: /\d/.test(newPw) },
              { label: isAr ? "رمز خاص" : "Special character", ok: /[!@#$%^&*]/.test(newPw) },
            ].map(({ label, ok }) => (
              <div key={label} className="flex items-center gap-2 text-xs">
                <span className={ok ? "text-green-500" : "text-muted-foreground"}>
                  {ok ? "✓" : "○"}
                </span>
                <span className={ok ? "text-green-600" : "text-muted-foreground"}>{label}</span>
              </div>
            ))}
          </div>

          <Button onClick={handleChangePassword} loading={isSaving}>
            {isAr ? "تغيير كلمة المرور" : "Change Password"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isAr ? "معلومات الجلسة" : "Session Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {[
            { label: isAr ? "مدة الجلسة" : "Session Duration", value: isAr ? "30 يوم" : "30 days" },
            { label: isAr ? "استراتيجية الجلسة" : "Session Strategy", value: "JWT" },
            { label: isAr ? "تشفير كلمة المرور" : "Password Hashing", value: "bcrypt (12 rounds)" },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between rounded-lg bg-muted/50 px-4 py-3">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium font-mono text-xs">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Notifications Tab ────────────────────────────────────────────────────────
function NotificationsTab() {
  const { locale } = useTranslation();
  const isAr = locale === "ar";

  const [settings, setSettings] = useState({
    lowStock:    true,
    newOrder:    true,
    newCustomer: false,
    dailyReport: true,
    weeklyReport: false,
  });

  const toggle = (key: keyof typeof settings) =>
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));

  const items = [
    { key: "lowStock"     as const, label: isAr ? "تنبيه المخزون المنخفض" : "Low Stock Alert",    desc: isAr ? "عند انخفاض مخزون منتج" : "When a product stock is low" },
    { key: "newOrder"     as const, label: isAr ? "طلب جديد"              : "New Order",           desc: isAr ? "عند استلام طلب جديد"   : "When a new order is placed" },
    { key: "newCustomer"  as const, label: isAr ? "عميل جديد"             : "New Customer",        desc: isAr ? "عند تسجيل عميل جديد"   : "When a new customer registers" },
    { key: "dailyReport"  as const, label: isAr ? "تقرير يومي"            : "Daily Report",        desc: isAr ? "ملخص يومي للمبيعات"    : "Daily sales summary" },
    { key: "weeklyReport" as const, label: isAr ? "تقرير أسبوعي"          : "Weekly Report",       desc: isAr ? "ملخص أسبوعي للأداء"    : "Weekly performance summary" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isAr ? "إعدادات الإشعارات" : "Notification Preferences"}
          </CardTitle>
          <CardDescription>
            {isAr ? "اختر الإشعارات التي تريد تلقيها" : "Choose which notifications you want to receive"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map(({ key, label, desc }) => (
            <label
              key={key}
              className="flex cursor-pointer items-center justify-between rounded-xl border p-4 hover:bg-muted/50 transition-colors"
            >
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
              <div
                onClick={() => toggle(key)}
                className={cn(
                  "relative h-6 w-11 rounded-full transition-colors",
                  settings[key] ? "bg-primary" : "bg-muted-foreground/30"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                    settings[key] ? "translate-x-5" : "translate-x-0.5"
                  )}
                />
              </div>
            </label>
          ))}
        </CardContent>
      </Card>

      <Button onClick={() => toast.success(isAr ? "تم حفظ الإعدادات" : "Settings saved")}>
        {isAr ? "حفظ الإعدادات" : "Save Preferences"}
      </Button>
    </div>
  );
}

// ─── Main SettingsTabs component ──────────────────────────────────────────────
interface SettingsTabsProps {
  store?: StoreSettingsData;
  storeSlug?: string;
}

export function SettingsTabs({ store, storeSlug }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const { locale } = useTranslation();
  const isAr = locale === "ar";

  const visibleTabs = store
    ? BASE_TABS
    : BASE_TABS.filter((t) => !["media", "contact", "seo"].includes(t.id));

  const tabContent: Record<TabId, React.ReactNode> = {
    general: store && storeSlug ? (
      <StoreSettingsPanel store={store} storeSlug={storeSlug} section="general" />
    ) : (
      <GeneralTabFallback />
    ),
    media: store && storeSlug ? (
      <StoreSettingsPanel store={store} storeSlug={storeSlug} section="media" />
    ) : null,
    contact: store && storeSlug ? (
      <StoreSettingsPanel store={store} storeSlug={storeSlug} section="contact" />
    ) : null,
    seo: store && storeSlug ? (
      <StoreSettingsPanel store={store} storeSlug={storeSlug} section="seo" />
    ) : null,
    appearance: (
      <div className="space-y-6">
        {store && storeSlug && (
          <StoreSettingsPanel store={store} storeSlug={storeSlug} section="appearance" />
        )}
        <AppearanceTab />
      </div>
    ),
    language:      <LanguageTab />,
    profile:       <ProfileTab />,
    security:      <SecurityTab />,
    notifications: <NotificationsTab />,
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Sidebar */}
      <nav className="w-full lg:w-56 shrink-0">
        <ul className="space-y-1">
          {visibleTabs.map((tab) => (
            <li key={tab.id}>
              <button
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <tab.icon className="h-4 w-4 shrink-0" />
                {isAr ? tab.labelAr : tab.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {tabContent[activeTab]}
      </div>
    </div>
  );
}
