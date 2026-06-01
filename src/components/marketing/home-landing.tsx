"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CreditCard,
  Globe2,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Store,
  Truck,
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
      pricing: "الأسعار",
      contact: "تواصل معنا",
      login: "تسجيل الدخول",
      start: "ابدأ الآن",
      dashboard: "لوحة التحكم",
      logout: "تسجيل الخروج",
    },
    hero: {
      badge: "منصة تجارة إلكترونية جاهزة للنمو",
      title: "ابن متجرك الإلكتروني وأدر كل شيء من مكان واحد",
      subtitle:
        "SPIDERdev تمنحك واجهة متجر عصرية، إدارة منتجات وطلبات، تحليلات، مدفوعات، وفريق عمل بصلاحيات واضحة. ابدأ بسرعة ووسع تجارتك بثقة.",
      start: "ابدأ مجانًا",
      plans: "استعرض الخطط",
      trust: ["إعداد سريع", "دعم عربي وإنجليزي", "لوحة تحكم آمنة"],
    },
    preview: {
      title: "نظرة على الأداء",
      today: "مبيعات اليوم",
      orders: "طلبات نشطة",
      conversion: "معدل التحويل",
      inventory: "تنبيه مخزون",
      shipping: "شحن جاهز",
      payments: "مدفوعات مفعلة",
    },
    stats: [
      { value: "500+", label: "متجر نشط" },
      { value: "10K+", label: "طلب شهريًا" },
      { value: "99.9%", label: "استقرار المنصة" },
    ],
    features: {
      eyebrow: "ما الذي تحصل عليه؟",
      title: "واجهة تشغيل كاملة لمتجرك",
      subtitle:
        "كل جزء في الصفحة مصمم لمساعدة صاحب المتجر على البيع والمتابعة واتخاذ القرار بسرعة.",
      items: [
        {
          title: "إدارة منتجات مرنة",
          description:
            "أضف المنتجات، الصور، التصنيفات، العلامات التجارية، الأسعار والمخزون من لوحة منظمة وسريعة.",
        },
        {
          title: "طلبات ومدفوعات واضحة",
          description:
            "تابع حالات الطلبات، طرق الدفع، الشحن، وبيانات العملاء بدون تعقيد أو تنقل زائد.",
        },
        {
          title: "تحليلات تساعدك تكبر",
          description:
            "اعرف المنتجات الأكثر مبيعًا، الإيرادات، وسلوك العملاء لاتخاذ قرارات أفضل.",
        },
      ],
    },
    pricing: {
      eyebrow: "خطط مرنة",
      title: "اختر الخطة المناسبة الآن",
      subtitle: "ابدأ بالخطة التي تناسب حجمك الحالي، ثم قم بالترقية عندما يكبر متجرك.",
      loading: "جاري تجهيز خطط الأسعار...",
      popular: "الأكثر اختيارًا",
      free: "مجاني",
      month: "شهر",
      yearly: "سنويًا",
      startFree: "ابدأ مجانًا",
      subscribe: "اشترك الآن",
    },
    cta: {
      title: "جاهز تطلق متجرك؟",
      subtitle:
        "أنشئ حسابك، اختر الخطة، وابدأ بإضافة منتجاتك. الصفحة الأولى في رحلتك التجارية تبدأ من هنا.",
      action: "إنشاء حساب",
    },
    footer: {
      description: "منصة متكاملة لإنشاء وإدارة المتاجر الإلكترونية بلغتين وتجربة استخدام عصرية.",
      quick: "روابط سريعة",
      support: "الدعم",
      rights: "جميع الحقوق محفوظة",
    },
  },
  en: {
    nav: {
      features: "Features",
      pricing: "Pricing",
      contact: "Contact",
      login: "Sign in",
      start: "Start now",
      dashboard: "Dashboard",
      logout: "Sign out",
    },
    hero: {
      badge: "Commerce platform built for growth",
      title: "Launch your online store and manage everything in one place",
      subtitle:
        "SPIDERdev gives you a polished storefront, product and order management, analytics, payments, and team permissions. Move fast, then scale with confidence.",
      start: "Start free",
      plans: "View plans",
      trust: ["Fast setup", "Arabic and English support", "Secure dashboard"],
    },
    preview: {
      title: "Performance snapshot",
      today: "Today sales",
      orders: "Active orders",
      conversion: "Conversion",
      inventory: "Stock alert",
      shipping: "Ready to ship",
      payments: "Payments on",
    },
    stats: [
      { value: "500+", label: "Active stores" },
      { value: "10K+", label: "Monthly orders" },
      { value: "99.9%", label: "Platform uptime" },
    ],
    features: {
      eyebrow: "What you get",
      title: "A complete operating layer for your store",
      subtitle:
        "Every section is shaped to help store owners sell, monitor, and make decisions without friction.",
      items: [
        {
          title: "Flexible catalog management",
          description:
            "Add products, images, categories, brands, pricing, and inventory from a clean dashboard.",
        },
        {
          title: "Clear orders and payments",
          description:
            "Track order statuses, payment methods, shipping, and customer details without messy workflows.",
        },
        {
          title: "Analytics that guide growth",
          description:
            "See best sellers, revenue, and customer behavior so every decision has context.",
        },
      ],
    },
    pricing: {
      eyebrow: "Flexible plans",
      title: "Choose the right plan today",
      subtitle: "Start with the plan that fits your current size, then upgrade as your store grows.",
      loading: "Pricing plans are being prepared...",
      popular: "Most chosen",
      free: "Free",
      month: "month",
      yearly: "yearly",
      startFree: "Start free",
      subscribe: "Subscribe now",
    },
    cta: {
      title: "Ready to launch your store?",
      subtitle:
        "Create your account, choose a plan, and start adding products. Your commerce journey starts here.",
      action: "Create account",
    },
    footer: {
      description: "A bilingual platform for building and managing modern online stores.",
      quick: "Quick links",
      support: "Support",
      rights: "All rights reserved",
    },
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

  const t = copy[locale];
  const isRTL = locale === "ar";
  const isAuthenticated = status === "authenticated";
  const dashboardHref = getDashboardHref(session?.user as HomeSessionUser);
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("lang");
    if (requested === "ar" || requested === "en") {
      setLocale(requested);
      return;
    }

    const saved = window.localStorage.getItem("marketing-locale");
    if (saved === "ar" || saved === "en") setLocale(saved);

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

  const featureIcons = useMemo(() => [PackageCheck, CreditCard, BarChart3], []);

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-[#f8fafc] text-slate-950">
      <nav
        className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
          scrolled
            ? "border-slate-200 bg-white/95 py-2 shadow-sm backdrop-blur"
            : "border-transparent bg-white/80 py-4 backdrop-blur"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="SPIDERdev">
            <span className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <Image src="/logo.png" alt="SPIDERdev" fill className="object-contain p-1.5" priority />
            </span>
            <span className="text-lg font-black tracking-normal">
              SPIDER<span className="text-teal-600">dev</span>
            </span>
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-teal-700">
              {t.nav.features}
            </a>
            <a href="#pricing" className="text-sm font-semibold text-slate-600 hover:text-teal-700">
              {t.nav.pricing}
            </a>
            <a href="#contact" className="text-sm font-semibold text-slate-600 hover:text-teal-700">
              {t.nav.contact}
            </a>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <LanguageSwitch locale={locale} setLocale={setLocale} />
            {isAuthenticated ? (
              <>
                <Link href={dashboardHref} className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800">
                  <LayoutDashboard className="h-4 w-4" />
                  {t.nav.dashboard}
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  {t.nav.logout}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-teal-200 hover:text-teal-700">
                  {t.nav.login}
                </Link>
                <Link href="/register" className="inline-flex h-10 items-center rounded-lg bg-teal-600 px-4 text-sm font-semibold text-white transition hover:bg-teal-700">
                  {t.nav.start}
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 md:hidden"
            onClick={() => setIsMenuOpen((value) => !value)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 shadow-lg md:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-3">
              <a href="#features" onClick={() => setIsMenuOpen(false)} className="rounded-lg px-2 py-2 text-sm font-semibold text-slate-700">
                {t.nav.features}
              </a>
              <a href="#pricing" onClick={() => setIsMenuOpen(false)} className="rounded-lg px-2 py-2 text-sm font-semibold text-slate-700">
                {t.nav.pricing}
              </a>
              <a href="#contact" onClick={() => setIsMenuOpen(false)} className="rounded-lg px-2 py-2 text-sm font-semibold text-slate-700">
                {t.nav.contact}
              </a>
              <LanguageSwitch locale={locale} setLocale={setLocale} full />
              <div className="grid gap-2 border-t border-slate-200 pt-3">
                {isAuthenticated ? (
                  <>
                    <Link href={dashboardHref} onClick={() => setIsMenuOpen(false)} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white">
                      <LayoutDashboard className="h-4 w-4" />
                      {t.nav.dashboard}
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700"
                    >
                      <LogOut className="h-4 w-4" />
                      {t.nav.logout}
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setIsMenuOpen(false)} className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">
                      {t.nav.login}
                    </Link>
                    <Link href="/register" onClick={() => setIsMenuOpen(false)} className="inline-flex h-11 items-center justify-center rounded-lg bg-teal-600 px-4 text-sm font-semibold text-white">
                      {t.nav.start}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <main>
        <section className="relative overflow-hidden bg-white pt-28 sm:pt-32">
          <div className="absolute inset-x-0 top-0 h-full bg-[linear-gradient(180deg,#ecfeff_0%,#ffffff_42%,#f8fafc_100%)]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8 lg:pb-20">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-800">
                <Sparkles className="h-4 w-4" />
                {t.hero.badge}
              </div>
              <h1 className="max-w-3xl text-xl font-black leading-tight tracking-normal text-slate-950 sm:text-4xl lg:text-5xl">
                {t.hero.title}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                {t.hero.subtitle}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-teal-600 px-6 text-base font-bold text-white shadow-sm transition hover:bg-teal-700">
                  {t.hero.start}
                  <ArrowIcon className="h-5 w-5" />
                </Link>
                <a href="#pricing" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 text-base font-bold text-slate-800 transition hover:border-teal-300 hover:text-teal-700">
                  {t.hero.plans}
                </a>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                {t.hero.trust.map((item) => (
                  <span key={item} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-200/80">
                <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-slate-200 bg-white">
                      <Image src="/logo.png" alt="SPIDERdev dashboard" fill className="object-contain p-1" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-950">{t.preview.title}</p>
                      <p className="text-xs font-semibold text-slate-500">SPIDERdev</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    Live
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Metric label={t.preview.today} value="$8.4K" tone="teal" />
                  <Metric label={t.preview.orders} value="128" tone="indigo" />
                  <Metric label={t.preview.conversion} value="4.8%" tone="amber" />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <Signal icon={ShieldCheck} label={t.preview.payments} />
                  <Signal icon={Truck} label={t.preview.shipping} />
                  <Signal icon={Zap} label={t.preview.inventory} />
                </div>
                <div className="mt-5 space-y-3">
                  {[82, 64, 48].map((value, index) => (
                    <div key={value} className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${
                          index === 0 ? "bg-teal-500" : index === 1 ? "bg-indigo-500" : "bg-amber-500"
                        }`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {t.stats.map((stat) => (
                  <div key={stat.label} className="rounded-lg border border-slate-200 bg-white p-4 text-center shadow-sm">
                    <p className="text-2xl font-black text-slate-950">{stat.value}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="bg-slate-50 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow={t.features.eyebrow} title={t.features.title} subtitle={t.features.subtitle} />
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {t.features.items.map((feature, index) => {
                const Icon = featureIcons[index];
                return (
                  <article key={feature.title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                    <div className="mb-5 grid h-12 w-12 place-items-center rounded-lg bg-teal-50 text-teal-700">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-black text-slate-950">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{feature.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow={t.pricing.eyebrow} title={t.pricing.title} subtitle={t.pricing.subtitle} />
            {plans.length === 0 ? (
              <p className="mt-10 text-center text-sm font-semibold text-slate-500">{t.pricing.loading}</p>
            ) : (
              <div className="mt-10 grid gap-5 lg:grid-cols-3">
                {plans.map((plan) => {
                  const name = locale === "ar" ? plan.nameAr || plan.displayName : plan.displayName || plan.name;
                  const features = locale === "ar" && plan.featuresAr?.length ? plan.featuresAr : plan.features;
                  const promo = locale === "ar" ? plan.promoLabelAr || plan.promoLabel : plan.promoLabel || plan.promoLabelAr;

                  return (
                    <article
                      key={plan._id}
                      className={`relative rounded-lg border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
                        plan.isFeatured ? "border-teal-500 ring-2 ring-teal-100" : "border-slate-200"
                      }`}
                    >
                      {plan.isFeatured && (
                        <div className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-teal-600 px-4 py-1 text-xs font-bold text-white">
                          <Sparkles className="h-3.5 w-3.5" />
                          {t.pricing.popular}
                        </div>
                      )}
                      {promo && (
                        <span className="mb-4 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                          {promo}
                        </span>
                      )}
                      <h3 className="text-2xl font-black text-slate-950">{name}</h3>
                      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{plan.description}</p>
                      <div className="mt-6">
                        <span className="text-4xl font-black text-slate-950">
                          {plan.price === 0 ? t.pricing.free : formatCurrency(plan.price, plan.currency)}
                        </span>
                        {plan.price > 0 && <span className="text-sm font-semibold text-slate-500"> / {t.pricing.month}</span>}
                        {plan.yearlyPrice > 0 && plan.price > 0 && (
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {formatCurrency(plan.yearlyPrice, plan.currency)} {t.pricing.yearly}
                          </p>
                        )}
                      </div>
                      <ul className="mt-6 space-y-3">
                        {features.slice(0, 6).map((feature) => (
                          <li key={feature} className="flex items-start gap-2 text-sm leading-6 text-slate-600">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Link
                        href="/register"
                        className={`mt-8 inline-flex h-11 w-full items-center justify-center rounded-lg text-sm font-bold transition ${
                          plan.isFeatured
                            ? "bg-teal-600 text-white hover:bg-teal-700"
                            : "bg-slate-950 text-white hover:bg-slate-800"
                        }`}
                      >
                        {plan.price === 0 ? t.pricing.startFree : t.pricing.subscribe}
                      </Link>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="bg-slate-950 py-16 text-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
            <div>
              <h2 className="text-3xl font-black tracking-normal sm:text-4xl">{t.cta.title}</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">{t.cta.subtitle}</p>
            </div>
            <Link href="/register" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-teal-500 px-6 text-base font-bold text-white transition hover:bg-teal-400">
              {t.cta.action}
              <ArrowIcon className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      <footer id="contact" className="bg-white py-12">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                <Image src="/logo.png" alt="SPIDERdev" fill className="object-contain p-1.5" />
              </span>
              <span className="text-lg font-black">
                SPIDER<span className="text-teal-600">dev</span>
              </span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-7 text-slate-600">{t.footer.description}</p>
            <p className="mt-3 text-sm font-semibold text-slate-500">support@memodev.com</p>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-950">{t.footer.quick}</h3>
            <div className="mt-4 grid gap-2 text-sm font-semibold text-slate-600">
              <a href="#features" className="hover:text-teal-700">{t.nav.features}</a>
              <a href="#pricing" className="hover:text-teal-700">{t.nav.pricing}</a>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-950">{t.footer.support}</h3>
            <div className="mt-4 grid gap-2 text-sm font-semibold text-slate-600">
              <a href="mailto:support@memodev.com" className="hover:text-teal-700">{t.nav.contact}</a>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-7xl border-t border-slate-200 px-4 pt-6 text-center text-sm font-semibold text-slate-500 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} SPIDERdev. {t.footer.rights}
        </div>
      </footer>
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
    <div className={`inline-flex items-center rounded-lg border border-slate-200 bg-white p-1 ${full ? "w-full" : ""}`}>
      <button
        type="button"
        onClick={() => setLocale("ar")}
        className={`inline-flex h-8 items-center justify-center gap-1 rounded-md px-3 text-xs font-bold transition ${
          full ? "flex-1" : ""
        } ${locale === "ar" ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"}`}
      >
        <Globe2 className="h-3.5 w-3.5" />
        عربي
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`inline-flex h-8 items-center justify-center gap-1 rounded-md px-3 text-xs font-bold transition ${
          full ? "flex-1" : ""
        } ${locale === "en" ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"}`}
      >
        <Globe2 className="h-3.5 w-3.5" />
        EN
      </button>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-sm font-black uppercase tracking-normal text-teal-700">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-black tracking-normal text-slate-950 sm:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-slate-600">{subtitle}</p>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "teal" | "indigo" | "amber" }) {
  const toneClass = {
    teal: "bg-teal-50 text-teal-700",
    indigo: "bg-indigo-50 text-indigo-700",
    amber: "bg-amber-50 text-amber-700",
  }[tone];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className={`mt-2 inline-flex rounded-md px-2 py-1 text-2xl font-black ${toneClass}`}>{value}</p>
    </div>
  );
}

function Signal({ icon: Icon, label }: { icon: typeof Store; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm font-bold text-slate-700">
      <Icon className="h-4 w-4 text-teal-700" />
      <span>{label}</span>
    </div>
  );
}
