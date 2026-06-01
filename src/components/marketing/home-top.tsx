"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  Sparkles,
  ShoppingCart,
  BarChart3,
  CreditCard,
  ArrowLeft,
  CheckCircle2,
  Menu,
  X,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import {
  getDefaultRedirect,
  getStoreAccessPermissions,
  isStoreManager,
  type Permission,
  type TenantRole,
} from "@/lib/auth/permissions";
import Image from "next/image";

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

export function HomeTop() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isAuthenticated = status === "authenticated";
  const dashboardHref = getDashboardHref(session?.user as HomeSessionUser);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled ? "bg-white shadow-md py-2" : "bg-white/95 backdrop-blur-sm py-4"
        }`}
      >
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-orange-100 bg-white shadow-lg">
  <Image
    src="/logo.png"
    alt="MEMODEV"
    fill
    className="object-contain p-1"
    priority
  />
</div>
            </div>
            <span className="font-bold text-xl">
              SPIDER<span className="text-orange-500">dev</span>
            </span>
          </div>

          <div className="hidden md:flex gap-8">
            <a href="#features" className="text-gray-600 hover:text-orange-500 transition font-medium">
              المميزات
            </a>
            <a href="#pricing" className="text-gray-600 hover:text-orange-500 transition font-medium">
              الأسعار
            </a>
            <a href="#contact" className="text-gray-600 hover:text-orange-500 transition font-medium">
              تواصل معنا
            </a>
          </div>

          <div className="hidden md:flex gap-3">
            {isAuthenticated ? (
              <>
                <Link href={dashboardHref} className="btn-primary inline-flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  لوحة التحكم
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="btn-outline inline-flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  تسجيل الخروج
                </button>
              </>
            ) : (
              <>
            <Link href="/login" className="btn-outline">
              تسجيل الدخول
            </Link>
            <Link href="/register" className="btn-primary">
              ابدأ الآن
            </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-white border-t mt-4 py-4 px-4 shadow-lg">
            <div className="flex flex-col gap-4">
              <a href="#features" className="text-gray-600 hover:text-orange-500 py-2" onClick={() => setIsMenuOpen(false)}>
                المميزات
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-orange-500 py-2" onClick={() => setIsMenuOpen(false)}>
                الأسعار
              </a>
              <a href="#contact" className="text-gray-600 hover:text-orange-500 py-2" onClick={() => setIsMenuOpen(false)}>
                تواصل معنا
              </a>
              <div className="flex flex-col gap-3 pt-4 border-t">
                {isAuthenticated ? (
                  <>
                    <Link
                      href={dashboardHref}
                      className="btn-primary text-center inline-flex items-center justify-center gap-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      لوحة التحكم
                    </Link>
                    <button
                      type="button"
                      className="btn-outline text-center inline-flex items-center justify-center gap-2"
                      onClick={() => {
                        setIsMenuOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      تسجيل الخروج
                    </button>
                  </>
                ) : (
                  <>
                <Link href="/login" className="btn-outline text-center" onClick={() => setIsMenuOpen(false)}>
                  تسجيل الدخول
                </Link>
                <Link href="/register" className="btn-primary text-center" onClick={() => setIsMenuOpen(false)}>
                  ابدأ الآن
                </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 via-white to-white" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-orange-200 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-orange-200 rounded-full blur-3xl opacity-30" />

        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-4xl mx-auto animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-orange-100 px-4 py-2 rounded-full mb-6 shadow-sm">
              <Sparkles className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-semibold text-orange-700">منصة SaaS متكاملة</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              أنشئ متجرك الإلكتروني
              <br />
              <span className="text-gradient">في دقائق</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              منصة متكاملة لإدارة المتاجر الإلكترونية مع نظام اشتراك مرن، أدوات تسويقية، وتحليلات ذكية تنمو مع عملك
            </p>
            <div className="mt-10 grid grid-cols-3 gap-6 max-w-3xl mx-auto">
  <div className="rounded-2xl bg-white p-6 shadow-lg">
    <h3 className="text-3xl font-bold text-orange-600">500+</h3>
    <p className="text-sm text-gray-500">متجر نشط</p>
  </div>

  <div className="rounded-2xl bg-white p-6 shadow-lg">
    <h3 className="text-3xl font-bold text-orange-600">10K+</h3>
    <p className="text-sm text-gray-500">طلب شهرياً</p>
  </div>

  <div className="rounded-2xl bg-white p-6 shadow-lg">
    <h3 className="text-3xl font-bold text-orange-600">99.9%</h3>
    <p className="text-sm text-gray-500">استقرار النظام</p>
  </div>
</div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4">
                ابدأ الآن مجاناً
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <a href="#pricing" className="btn-outline inline-flex items-center gap-2 text-lg px-8 py-4">
                عرض الخطط
              </a>
            </div>

            <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-orange-500" />
                <span>لا حاجة لخبرة تقنية</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-orange-500" />
                <span>تجهيز فوري للمتجر</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-orange-500" />
                <span>دعم فني 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ميزات <span className="text-orange-500">متكاملة</span> لمتجرك
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              كل ما تحتاجه لإدارة متجرك الإلكتروني بنجاح في مكان واحد
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: ShoppingCart,
                title: "إدارة المنتجات",
                description: "أضف منتجاتك بسهولة مع إدارة المخزون والأسعار والخصومات والعروض",
              },
              {
                icon: BarChart3,
                title: "تحليلات وتقارير",
                description: "تقارير مفصلة عن المبيعات والعملاء وأداء المتجر لاتخاذ قرارات ذكية",
              },
              {
                icon: CreditCard,
                title: "بوابات دفع متعددة",
                description: "دعم جميع بوابات الدفع المحلية والعالمية لتسهيل عملية الشراء",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-5">
                  <feature.icon className="w-7 h-7 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
