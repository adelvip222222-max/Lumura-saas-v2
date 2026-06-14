"use client";

import Image from "next/image";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowRight, Eye, EyeOff, LayoutDashboard, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getDefaultRedirect,
  getStoreAccessPermissions,
  isStoreManager,
  type Permission,
  type TenantRole,
} from "@/lib/auth/permissions";

type SessionStore = {
  slug: string;
  permissions?: Permission[];
  isManager?: boolean;
};

type SessionUser = {
  role?: TenantRole | null;
  storeSlug?: string | null;
  stores?: SessionStore[];
  permissions?: Permission[];
};

function getRedirectPath(user?: SessionUser | null) {
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

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    if (status !== "authenticated") return;

    const callbackUrl = searchParams.get("callbackUrl");
    const redirectTo =
      callbackUrl?.startsWith("/") &&
      !callbackUrl.startsWith("//") &&
      !callbackUrl.startsWith("/\\") &&
      !callbackUrl.startsWith("/login")
        ? callbackUrl
        : getRedirectPath(session?.user as SessionUser);

    router.replace(redirectTo);
  }, [router, searchParams, session?.user, status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        const messages: Record<string, string> = {
          invalid_credentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
          pending_verification: "يرجى تأكيد بريدك الإلكتروني قبل تسجيل الدخول",
          inactive_account: "حسابك غير نشط",
          suspended_account: "حسابك معلق",
          expired_subscription: "اشتراكك منتهي",
          CredentialsSignin: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
        };

        setError(messages[result.error] ?? result.error);
        return;
      }

      const sessionRes = await fetch("/api/auth/session");
      const sessionData = await sessionRes.json();

      router.push(getRedirectPath(sessionData?.user));
      router.refresh();
    } catch {
      setError("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50" dir="rtl">
      <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        <section className="hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="relative h-12 w-12 overflow-hidden rounded-lg bg-white">
              <Image src="/logo.png" alt="SPIDERdev" fill className="object-contain p-1.5" priority />
            </span>
            <span className="text-xl font-black">
              SPIDER<span className="text-teal-400">dev</span>
            </span>
          </Link>

          <div className="max-w-lg">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-teal-100">
              <LayoutDashboard className="h-4 w-4" />
              لوحة تحكم التجار
            </div>
            <h1 className="text-4xl font-black leading-tight">
              ادخل إلى لوحة تحكم متجرك وتابع مبيعاتك بثقة.
            </h1>
            <p className="mt-5 leading-8 text-slate-300">
              إدارة المنتجات، الطلبات، الاشتراكات، وفريق العمل من مكان واحد بتجربة آمنة ومنظمة.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              ["آمن", "جلسات محمية"],
              ["سريع", "وصول مباشر"],
              ["منظم", "صلاحيات واضحة"],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-lg bg-white/10 p-4">
                <p className="font-black">{title}</p>
                <p className="mt-1 text-xs text-slate-300">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center lg:hidden">
              <Link href="/" className="inline-flex items-center gap-3">
                <span className="relative h-14 w-14 overflow-hidden rounded-lg border bg-white shadow-sm">
                  <Image src="/logo.png" alt="SPIDERdev" fill className="object-contain p-1.5" priority />
                </span>
                <span className="text-xl font-black">
                  SPIDER<span className="text-teal-600">dev</span>
                </span>
              </Link>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
              <div className="text-center">
                <div className="mx-auto mb-4 hidden h-16 w-16 place-items-center rounded-lg border border-slate-200 bg-white shadow-sm lg:grid">
                  <Image src="/logo.png" alt="SPIDERdev" width={48} height={48} className="object-contain" />
                </div>
                <h2 className="text-2xl font-black text-slate-950">تسجيل الدخول</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  استخدم بريدك وكلمة المرور للوصول إلى لوحة تحكم متجرك.
                </p>
              </div>

              {searchParams.get("verified") && (
                <StatusMessage tone="success" text="تم التحقق بنجاح. يمكنك تسجيل الدخول الآن." />
              )}
              {searchParams.get("registered") && (
                <StatusMessage tone="success" text="تم إنشاء الحساب بنجاح. سجل دخولك للمتابعة." />
              )}
              {searchParams.get("reset") === "success" && (
                <StatusMessage tone="success" text="تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن." />
              )}
              {error && (
                <div className="mt-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                  <p className="text-sm font-medium text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <Label htmlFor="email" className="text-slate-700">
                    البريد الإلكتروني
                  </Label>
                  <div className="relative mt-2">
                    <Mail className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      dir="ltr"
                      className="h-12 rounded-lg border-slate-200 !pr-10 text-left"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-slate-700">
                      كلمة المرور
                    </Label>
                    <Link href="/forgot-password" className="text-sm font-semibold text-teal-700 hover:text-teal-800">
                      نسيت كلمة المرور؟
                    </Link>
                  </div>
                  <div className="relative mt-2">
                    <Lock className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      dir="ltr"
                      className="h-12 rounded-lg border-slate-200 !px-10 text-left"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="h-12 w-full rounded-lg bg-teal-600 font-bold text-white [background-image:none] hover:bg-teal-700">
                  {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                  {!loading && <ArrowRight className="mr-2 h-4 w-4" />}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-600">
                ليس لديك حساب؟{" "}
                <Link href="/register" className="font-bold text-teal-700 hover:text-teal-800">
                  إنشاء حساب جديد
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatusMessage({ text, tone }: { text: string; tone: "success" }) {
  const classes = tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "";

  return (
    <div className={`mt-5 rounded-lg border p-3 text-center text-sm font-semibold ${classes}`}>
      {text}
    </div>
  );
}
