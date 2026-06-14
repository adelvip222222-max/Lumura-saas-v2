"use client";

import Image from "next/image";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  Globe2,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  Menu,
  PackageCheck,
  Palette,
  ShieldCheck,
  Sparkles,
  Store,
  Tags,
  Truck,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  getDefaultRedirect,
  getStoreAccessPermissions,
  isStoreManager,
  type Permission,
  type TenantRole,
} from "@/lib/auth/permissions";
import type { PublicPlan } from "@/actions/plans";
import { formatCurrency } from "@/lib/utils";

type Locale = "ar" | "en";
type AuthMode = "login" | "register" | null;

type SessionStore = {
  slug: string;
  permissions?: Permission[];
  isManager?: boolean;
};

type HomeSessionUser = {
  role?: TenantRole | null;
  storeSlug?: string | null;
  stores?: SessionStore[];
  permissions?: Permission[];
};

type Props = {
  plans: PublicPlan[];
};

const copy = {
  ar: {
    nav: {
      features: "المميزات",
      templates: "القوالب",
      pricing: "الأسعار",
      login: "تسجيل الدخول",
      start: "إنشاء حساب",
      dashboard: "لوحة التحكم",
      logout: "تسجيل الخروج",
    },
    hero: {
      badge: "منصة SaaS متعددة المستأجرين للمتاجر الإلكترونية",
      title: "أطلق أكثر من متجر لكل مستأجر وادفع اشتراك كل متجر وحده",
      subtitle:
        "Lumura تجمع المتجر، الطلبات، المنتجات، الفئات، الماركات، الفريق، الاشتراك، التقارير وتخصيص الواجهة داخل نظام واحد جاهز للتوسع.",
      start: "ابدأ من النافذة السريعة",
      plans: "شاهد الخطط",
    },
    stats: [
      { value: "15+", label: "فئة تلقائية لكل نشاط" },
      { value: "Multi", label: "متاجر لكل مستأجر" },
      { value: "RTL/LTR", label: "عربي وإنجليزي" },
    ],
    featuresTitle: "كل أدوات تشغيل المتجر في لوحة واحدة",
    featuresSub: "من أول إنشاء المتجر وحتى متابعة الطلبات والصلاحيات والاشتراك.",
    features: [
      ["كتالوج ذكي", "إضافة فئات، فئات فرعية، ماركات ومنتجات مرتبطة بكل متجر بشكل مستقل."],
      ["اشتراك لكل متجر", "كل متجر له خطته الشهرية أو السنوية وحالة الاشتراك الخاصة به."],
      ["فريق بصلاحيات", "المستأجر يضيف موظفين بصلاحيات مختلفة ولوحة مناسبة لكل دور."],
      ["إشعارات لحظية", "تنبيهات داخل اللوحة مع صوت وظهور مباشر عند الأحداث المهمة."],
      ["قوالب شكل المتجر", "اختيار شكل المنتجات، الفلاتر، الهيرو، الألوان، الأيقونات والفونتات."],
      ["تقارير ومؤشرات", "متابعة الطلبات والإيرادات والمنتجات والعملاء لكل متجر على حدة."],
    ],
    templatesTitle: "قوالب واجهة متجر جاهزة للتخصيص",
    templatesSub: "المستأجر يختار النشاط والثيم، والنظام يجهز الفئات والماركات كبداية احترافية.",
    templates: ["إلكترونيات", "ملابس وموضة", "تجميل", "سوبر ماركت", "منزل وديكور", "رياضة ولياقة"],
    flowTitle: "رحلة تشغيل مختصرة",
    flow: [
      ["1", "أنشئ الحساب", "نافذة تسجيل سريعة بدون مغادرة الصفحة الرئيسية."],
      ["2", "اختر نشاط المتجر", "يتم تجهيز 15 فئة وفئات فرعية وماركات تلقائيًا."],
      ["3", "خصص الواجهة", "ألوان، فونت، هيرو، شبكة منتجات ومكان الفلاتر."],
      ["4", "ابدأ البيع", "أضف المنتجات وادعُ الموظفين وتابع الطلبات."],
    ],
    dashboardTitle: "لوحات تحكم منفصلة وواضحة",
    dashboardSub: "لوحة المستأجر الأساسية لإدارة المتاجر، ولوحة داخل كل متجر للمنتجات والطلبات والفئات والماركات.",
    pricingTitle: "خطط مرنة لكل متجر",
    pricingSub: "ادفع حسب حجم كل متجر، وليس كل الحساب مرة واحدة.",
    ctaTitle: "جاهز تبني منصة تجارة إلكترونية احترافية؟",
    ctaSub: "ابدأ بإنشاء حسابك ثم أنشئ أول متجر واختر نشاطه وثيمه.",
  },
  en: {
    nav: {
      features: "Features",
      templates: "Templates",
      pricing: "Pricing",
      login: "Sign in",
      start: "Create account",
      dashboard: "Dashboard",
      logout: "Sign out",
    },
    hero: {
      badge: "Multi-tenant SaaS for ecommerce stores",
      title: "Launch multiple stores per tenant with billing per store",
      subtitle:
        "Lumura brings storefronts, orders, products, categories, brands, team roles, subscriptions, reports, and visual customization into one scalable system.",
      start: "Start in a quick popup",
      plans: "View plans",
    },
    stats: [
      { value: "15+", label: "Auto categories per activity" },
      { value: "Multi", label: "Stores per tenant" },
      { value: "RTL/LTR", label: "Arabic and English" },
    ],
    featuresTitle: "Everything your store needs in one dashboard",
    featuresSub: "From store setup to orders, roles, billing, and reporting.",
    features: [
      ["Smart catalog", "Categories, subcategories, brands, and products are isolated per store."],
      ["Billing per store", "Each store has its own monthly or yearly plan and subscription state."],
      ["Role-based team", "Tenants can add employees with dashboards that match their permissions."],
      ["Realtime alerts", "Dashboard notifications with sound and in-screen toasts for important events."],
      ["Storefront themes", "Choose grids, filters, hero sections, colors, icons, and fonts."],
      ["Reports and analytics", "Track orders, revenue, products, and customers per store."],
    ],
    templatesTitle: "Ready storefront templates",
    templatesSub: "Pick an activity and theme, then the system prepares categories and brands for a professional start.",
    templates: ["Electronics", "Fashion", "Beauty", "Grocery", "Home decor", "Sports"],
    flowTitle: "A shorter launch journey",
    flow: [
      ["1", "Create account", "Fast auth popup without leaving the landing page."],
      ["2", "Pick activity", "15 categories, subcategories, and brands are seeded automatically."],
      ["3", "Customize design", "Colors, fonts, hero, product grid, and filter placement."],
      ["4", "Start selling", "Add products, invite staff, and manage orders."],
    ],
    dashboardTitle: "Clear separated dashboards",
    dashboardSub: "A main tenant dashboard for stores and a dedicated dashboard inside every store.",
    pricingTitle: "Flexible plans per store",
    pricingSub: "Pay according to each store size, not the whole tenant account at once.",
    ctaTitle: "Ready to build a professional ecommerce SaaS?",
    ctaSub: "Create your account, add your first store, then choose its activity and theme.",
  },
} as const;

function getDashboardHref(user?: HomeSessionUser | null) {
  const role = user?.role;
  if (!role) return "/dashboard";

  const storeSlug = user.storeSlug ?? user.stores?.[0]?.slug ?? undefined;
  const permissions = storeSlug
    ? getStoreAccessPermissions(user.stores, storeSlug)
    : user.permissions ?? [];

  return getDefaultRedirect(
    role,
    storeSlug,
    permissions,
    storeSlug ? isStoreManager(user.stores, storeSlug) : false
  );
}

export function HomeLanding({ plans }: Props) {
  const { data: session, status } = useSession();
  const [locale, setLocale] = useState<Locale>("ar");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>(null);

  const t = copy[locale];
  const isRTL = locale === "ar";
  const isAuthenticated = status === "authenticated";
  const dashboardHref = getDashboardHref(session?.user as HomeSessionUser);
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("lang");
    const requestedAuth = params.get("auth");
    if (requestedAuth === "login" || requestedAuth === "register") setAuthMode(requestedAuth);
    if (requested === "ar" || requested === "en") setLocale(requested);
    else {
      const saved = window.localStorage.getItem("marketing-locale");
      if (saved === "ar" || saved === "en") setLocale(saved);
    }

    const handleScroll = () => setScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("marketing-locale", locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
  }, [isRTL, locale]);

  const featureIcons = useMemo(
    () => [PackageCheck, CreditCard, Users, Zap, Palette, BarChart3],
    []
  );

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-slate-50 text-slate-950">
      <nav
        className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
          scrolled ? "border-slate-200 bg-white/95 py-2 shadow-sm backdrop-blur" : "border-transparent bg-white/85 py-4 backdrop-blur"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="MEMODEV">
            <span className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <Image src="/logo.png" alt="MEMODEV" fill className="object-contain p-1.5" priority />
            </span>
            <span className="text-lg font-black tracking-normal">
              MEMO<span className="text-orange-600">DEV</span>
            </span>
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-orange-700">{t.nav.features}</a>
            <a href="#templates" className="text-sm font-semibold text-slate-600 hover:text-orange-700">{t.nav.templates}</a>
            <a href="#pricing" className="text-sm font-semibold text-slate-600 hover:text-orange-700">{t.nav.pricing}</a>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <LanguageSwitch locale={locale} setLocale={setLocale} />
            {isAuthenticated ? (
              <>
                <Link href={dashboardHref} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800">
                  <LayoutDashboard className="h-4 w-4" />
                  {t.nav.dashboard}
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  {t.nav.logout}
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => setAuthMode("login")} className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-700">
                  {t.nav.login}
                </button>
                <button type="button" onClick={() => setAuthMode("register")} className="inline-flex h-10 items-center rounded-xl bg-orange-600 px-4 text-sm font-semibold text-white transition hover:bg-orange-700">
                  {t.nav.start}
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 md:hidden"
            onClick={() => setIsMenuOpen((value) => !value)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 shadow-lg md:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-3">
              <a href="#features" onClick={() => setIsMenuOpen(false)} className="rounded-lg px-2 py-2 text-sm font-semibold text-slate-700">{t.nav.features}</a>
              <a href="#templates" onClick={() => setIsMenuOpen(false)} className="rounded-lg px-2 py-2 text-sm font-semibold text-slate-700">{t.nav.templates}</a>
              <a href="#pricing" onClick={() => setIsMenuOpen(false)} className="rounded-lg px-2 py-2 text-sm font-semibold text-slate-700">{t.nav.pricing}</a>
              <LanguageSwitch locale={locale} setLocale={setLocale} full />
              <div className="grid gap-2 border-t border-slate-200 pt-3">
                {isAuthenticated ? (
                  <>
                    <Link href={dashboardHref} onClick={() => setIsMenuOpen(false)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white">
                      <LayoutDashboard className="h-4 w-4" />
                      {t.nav.dashboard}
                    </Link>
                    <button type="button" onClick={() => signOut({ callbackUrl: "/" })} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">
                      <LogOut className="h-4 w-4" />
                      {t.nav.logout}
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => { setIsMenuOpen(false); setAuthMode("login"); }} className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">
                      {t.nav.login}
                    </button>
                    <button type="button" onClick={() => { setIsMenuOpen(false); setAuthMode("register"); }} className="inline-flex h-11 items-center justify-center rounded-xl bg-orange-600 px-4 text-sm font-semibold text-white">
                      {t.nav.start}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <main>
        <section className="relative overflow-hidden bg-white pt-28 sm:pt-32">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#fed7aa_0,transparent_32%),linear-gradient(180deg,#fff7ed_0%,#ffffff_46%,#f8fafc_100%)]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-[1fr_0.92fr] lg:px-8 lg:pb-24">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-bold text-orange-800">
                <Sparkles className="h-4 w-4" />
                {t.hero.badge}
              </div>
              <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                {t.hero.title}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                {t.hero.subtitle}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={() => setAuthMode("register")} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 text-base font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-700">
                  {t.hero.start}
                  <ArrowIcon className="h-5 w-5" />
                </button>
                <a href="#pricing" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 text-base font-bold text-slate-800 transition hover:border-orange-300 hover:text-orange-700">
                  {t.hero.plans}
                </a>
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {t.stats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                    <p className="text-2xl font-black text-slate-950">{stat.value}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-[2.5rem] bg-orange-100/70 blur-3xl" />
              <div className="relative rounded-[2rem] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-200">
                <div className="flex items-center justify-between rounded-2xl bg-slate-950 px-4 py-3 text-white">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500"><Store className="h-5 w-5" /></span>
                    <div>
                      <p className="text-sm font-black">Tenant Dashboard</p>
                      <p className="text-xs text-slate-300">3 stores • live alerts</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">Live</span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <Metric label="Revenue" value="EGP 82K" icon={CreditCard} />
                  <Metric label="Orders" value="246" icon={Truck} />
                  <Metric label="Products" value="1.2K" icon={Boxes} />
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-[0.78fr_1fr]">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-sm font-black text-slate-950">Store themes</p>
                    <div className="mt-4 space-y-3">
                      {["Modern", "Luxury", "Boutique"].map((item, index) => (
                        <div key={item} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                          <span className={`h-8 w-8 rounded-xl ${index === 0 ? "bg-orange-500" : index === 1 ? "bg-slate-950" : "bg-emerald-500"}`} />
                          <span className="text-sm font-bold text-slate-700">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-sm font-black text-slate-950">Auto catalog seed</p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {["📱 Electronics", "👗 Fashion", "💄 Beauty", "🥬 Grocery"].map((item) => (
                        <span key={item} className="rounded-xl bg-orange-50 px-3 py-2 text-xs font-bold text-orange-800">{item}</span>
                      ))}
                    </div>
                    <div className="mt-5 space-y-3">
                      {[88, 72, 56].map((value) => (
                        <div key={value} className="h-3 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-orange-500" style={{ width: `${value}%` }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="bg-slate-50 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading title={t.featuresTitle} subtitle={t.featuresSub} />
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {t.features.map(([title, description], index) => {
                const Icon = featureIcons[index];
                return (
                  <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                    <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-orange-700">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-black text-slate-950">{title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="templates" className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading title={t.templatesTitle} subtitle={t.templatesSub} />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {t.templates.map((template, index) => (
                <article key={template} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                  <div className="h-28 bg-gradient-to-br from-orange-100 via-white to-slate-100 p-4">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-orange-600 shadow-sm">
                      <Tags className="h-6 w-6" />
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-black text-slate-950">{template}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">15 categories • subcategories • 15 brands</p>
                    <div className="mt-4 flex gap-2">
                      {["Hero", "Grid", "Filters"].map((tag) => (
                        <span key={`${template}-${tag}`} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{tag}</span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-950 py-16 text-white sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.24em] text-orange-300">Workflow</p>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">{t.flowTitle}</h2>
              <p className="mt-4 max-w-lg text-sm leading-7 text-slate-300">{t.dashboardSub}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {t.flow.map(([step, title, description]) => (
                <article key={step} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500 text-sm font-black text-white">{step}</span>
                  <h3 className="mt-4 text-lg font-black">{title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-300">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <SectionHeading align="start" title={t.dashboardTitle} subtitle={t.dashboardSub} />
              <div className="mt-8 grid gap-3">
                {[ShieldCheck, Globe2, CheckCircle2].map((Icon, index) => (
                  <div key={index} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-50 text-orange-700"><Icon className="h-5 w-5" /></span>
                    <span className="font-bold text-slate-700">{index === 0 ? "Tenant isolation" : index === 1 ? "Store-level dashboard" : "Role-based access"}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200">
              <div className="grid grid-cols-[120px_1fr] overflow-hidden rounded-2xl border border-slate-200">
                <div className="bg-slate-950 p-4 text-white">
                  <p className="text-xs font-bold text-orange-300">MEMODEV</p>
                  <div className="mt-5 space-y-2">
                    {["Stores", "Orders", "Team", "Billing"].map((item) => (
                      <div key={item} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold">{item}</div>
                    ))}
                  </div>
                </div>
                <div className="bg-slate-50 p-4">
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-sm font-black text-slate-950">Store performance</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <Metric label="Orders" value="92" icon={Truck} />
                      <Metric label="Customers" value="1.8K" icon={Users} />
                    </div>
                  </div>
                  <div className="mt-3 rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-sm font-black text-slate-950">Realtime notifications</p>
                    <p className="mt-2 text-xs leading-6 text-slate-500">Order created • payment uploaded • low stock</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading title={t.pricingTitle} subtitle={t.pricingSub} />
            {plans.length === 0 ? (
              <p className="mt-10 text-center text-sm font-semibold text-slate-500">Pricing plans are being prepared...</p>
            ) : (
              <div className="mt-10 grid gap-5 lg:grid-cols-3">
                {plans.map((plan) => {
                  const name = locale === "ar" ? plan.nameAr || plan.displayName : plan.displayName || plan.name;
                  const features = locale === "ar" && plan.featuresAr?.length ? plan.featuresAr : plan.features;
                  return (
                    <article key={plan._id} className={`relative rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${plan.isFeatured ? "border-orange-500 ring-2 ring-orange-100" : "border-slate-200"}`}>
                      {plan.isFeatured && (
                        <div className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-orange-600 px-4 py-1 text-xs font-bold text-white">
                          <Sparkles className="h-3.5 w-3.5" /> Popular
                        </div>
                      )}
                      <h3 className="text-2xl font-black text-slate-950">{name}</h3>
                      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{plan.description}</p>
                      <div className="mt-6">
                        <span className="text-4xl font-black text-slate-950">
                          {plan.price === 0 ? "Free" : formatCurrency(plan.price, plan.currency)}
                        </span>
                        {plan.price > 0 && <span className="text-sm font-semibold text-slate-500"> / month</span>}
                      </div>
                      <ul className="mt-6 space-y-3">
                        {features.slice(0, 6).map((feature) => (
                          <li key={feature} className="flex items-start gap-2 text-sm leading-6 text-slate-600">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <button type="button" onClick={() => setAuthMode("register")} className={`mt-8 inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-bold transition ${plan.isFeatured ? "bg-orange-600 text-white hover:bg-orange-700" : "bg-slate-950 text-white hover:bg-slate-800"}`}>
                        {t.nav.start}
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="bg-orange-600 py-16 text-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
            <div>
              <h2 className="text-3xl font-black tracking-normal sm:text-4xl">{t.ctaTitle}</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-orange-50 sm:text-base">{t.ctaSub}</p>
            </div>
            <button type="button" onClick={() => setAuthMode("register")} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-base font-bold text-orange-700 transition hover:bg-orange-50">
              {t.nav.start}
              <ArrowIcon className="h-5 w-5" />
            </button>
          </div>
        </section>
      </main>

      <footer className="bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 text-sm font-semibold text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
              <Image src="/logo.png" alt="MEMODEV" fill className="object-contain p-1.5" />
            </span>
            <span className="text-lg font-black text-slate-950">MEMO<span className="text-orange-600">DEV</span></span>
          </div>
          <p>© {new Date().getFullYear()} MEMODEV. All rights reserved.</p>
          <a href="mailto:support@memodev.com" className="hover:text-orange-700">support@memodev.com</a>
        </div>
      </footer>

      <AuthPopup mode={authMode} setMode={setAuthMode} locale={locale} />
    </div>
  );
}

function LanguageSwitch({
  locale,
  setLocale,
  full = false,
}: {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  full?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-700 ${full ? "w-full" : ""}`}
    >
      <Globe2 className="h-4 w-4" />
      {locale === "ar" ? "English" : "العربية"}
    </button>
  );
}

function SectionHeading({ title, subtitle, align = "center" }: { title: string; subtitle: string; align?: "center" | "start" }) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <h2 className="text-3xl font-black leading-tight text-slate-950 sm:text-4xl">{title}</h2>
      <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">{subtitle}</p>
    </div>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Store }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-500">{label}</p>
        <Icon className="h-4 w-4 text-orange-600" />
      </div>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function AuthPopup({ mode, setMode, locale }: { mode: AuthMode; setMode: (mode: AuthMode) => void; locale: Locale }) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    slug: "",
    phone: "",
    plan: "MONTHLY",
  });

  useEffect(() => {
    if (!mode) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMode(null);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mode, setMode]);

  if (!mode) return null;

  const isAr = locale === "ar";
  const isLogin = mode === "login";

  const generateSlug = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const result = await signIn("credentials", {
        email: loginData.email,
        password: loginData.password,
        redirect: false,
      });

      if (result?.error) {
        setMessage(isAr ? "البريد الإلكتروني أو كلمة المرور غير صحيحة" : "Invalid email or password");
        return;
      }

      window.location.href = "/dashboard";
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerData),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || (isAr ? "فشل إنشاء الحساب" : "Registration failed"));
        return;
      }

      setMessage(isAr ? "تم إنشاء الحساب. سجل الدخول للمتابعة." : "Account created. Sign in to continue.");
      setMode("login");
    } catch {
      setMessage(isAr ? "حدث خطأ في الاتصال" : "Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm" dir={isAr ? "rtl" : "ltr"}>
      <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-2xl">
        <button
          type="button"
          onClick={() => setMode(null)}
          className="absolute left-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-red-50 hover:text-red-600"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="bg-gradient-to-br from-slate-950 to-orange-700 px-6 pb-10 pt-8 text-white">
          <div className="flex items-center gap-3">
            <span className="relative h-12 w-12 overflow-hidden rounded-2xl bg-white">
              <Image src="/logo.png" alt="MEMODEV" fill className="object-contain p-1.5" />
            </span>
            <div>
              <p className="text-lg font-black">MEMODEV</p>
              <p className="text-xs font-semibold text-orange-100">SaaS Commerce Platform</p>
            </div>
          </div>
          <h2 className="mt-8 text-2xl font-black">
            {isLogin ? (isAr ? "تسجيل الدخول" : "Sign in") : isAr ? "إنشاء حساب جديد" : "Create account"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-orange-50">
            {isLogin
              ? isAr
                ? "ادخل إلى لوحة تحكم المستأجر أو المتجر بسرعة."
                : "Access your tenant or store dashboard quickly."
              : isAr
                ? "أنشئ حساب المستأجر ثم أضف متجرك الأول."
                : "Create the tenant account, then add your first store."}
          </p>
        </div>

        <div className="-mt-5 rounded-t-[2rem] bg-white p-6">
          <div className="mb-5 grid grid-cols-2 rounded-2xl bg-slate-100 p-1 text-sm font-bold">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`rounded-xl py-2 transition ${isLogin ? "bg-white text-orange-700 shadow-sm" : "text-slate-500"}`}
            >
              {isAr ? "دخول" : "Login"}
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`rounded-xl py-2 transition ${!isLogin ? "bg-white text-orange-700 shadow-sm" : "text-slate-500"}`}
            >
              {isAr ? "تسجيل" : "Register"}
            </button>
          </div>

          {message && (
            <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-800">
              {message}
            </div>
          )}

          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <PopupField icon={Mail} label={isAr ? "البريد الإلكتروني" : "Email"}>
                <input
                  type="email"
                  dir="ltr"
                  required
                  value={loginData.email}
                  onChange={(event) => setLoginData((prev) => ({ ...prev, email: event.target.value }))}
                  className="h-12 w-full rounded-xl border border-slate-200 px-10 text-left outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  placeholder="name@example.com"
                />
              </PopupField>
              <PopupField icon={Lock} label={isAr ? "كلمة المرور" : "Password"}>
                <PasswordInput value={loginData.password} onChange={(value) => setLoginData((prev) => ({ ...prev, password: value }))} show={showPassword} setShow={setShowPassword} />
              </PopupField>
              <button type="submit" disabled={loading} className="h-12 w-full rounded-xl bg-orange-600 font-bold text-white transition hover:bg-orange-700 disabled:opacity-60">
                {loading ? (isAr ? "جاري الدخول..." : "Signing in...") : isAr ? "دخول" : "Sign in"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <PopupField icon={Store} label={isAr ? "اسم المستأجر / الشركة" : "Tenant / company name"}>
                <input
                  required
                  value={registerData.name}
                  onChange={(event) => {
                    const name = event.target.value;
                    setRegisterData((prev) => ({ ...prev, name, slug: prev.slug || generateSlug(name) }));
                  }}
                  className="h-12 w-full rounded-xl border border-slate-200 px-10 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  placeholder={isAr ? "مثال: محمود عادل" : "Example Store"}
                />
              </PopupField>
              <PopupField icon={Mail} label={isAr ? "البريد الإلكتروني" : "Email"}>
                <input
                  type="email"
                  dir="ltr"
                  required
                  value={registerData.email}
                  onChange={(event) => setRegisterData((prev) => ({ ...prev, email: event.target.value }))}
                  className="h-12 w-full rounded-xl border border-slate-200 px-10 text-left outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  placeholder="name@example.com"
                />
              </PopupField>
              <PopupField icon={Globe2} label="Slug">
                <input
                  dir="ltr"
                  required
                  value={registerData.slug}
                  onChange={(event) => setRegisterData((prev) => ({ ...prev, slug: generateSlug(event.target.value) }))}
                  className="h-12 w-full rounded-xl border border-slate-200 px-10 text-left font-mono outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  placeholder="my-store"
                />
              </PopupField>
              <PopupField icon={Lock} label={isAr ? "كلمة المرور" : "Password"}>
                <PasswordInput value={registerData.password} onChange={(value) => setRegisterData((prev) => ({ ...prev, password: value }))} show={showPassword} setShow={setShowPassword} />
              </PopupField>
              <button type="submit" disabled={loading} className="h-12 w-full rounded-xl bg-orange-600 font-bold text-white transition hover:bg-orange-700 disabled:opacity-60">
                {loading ? (isAr ? "جاري الإنشاء..." : "Creating...") : isAr ? "إنشاء الحساب" : "Create account"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function PopupField({ icon: Icon, label, children }: { icon: typeof Store; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
      <span className="relative block">
        <Icon className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        {children}
      </span>
    </label>
  );
}

function PasswordInput({ value, onChange, show, setShow }: { value: string; onChange: (value: string) => void; show: boolean; setShow: (value: boolean) => void }) {
  return (
    <span className="relative block">
      <input
        type={show ? "text" : "password"}
        dir="ltr"
        required
        minLength={8}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-slate-200 px-10 text-left outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
        placeholder="Example@123"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
      >
        {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </span>
  );
}
