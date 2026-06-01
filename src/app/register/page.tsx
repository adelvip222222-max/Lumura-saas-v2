"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRight,
  AtSign,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe2,
  Lock,
  Phone,
  Store,
  User,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const passwordRules = [
  { key: "length", label: "8 أحرف على الأقل", test: (value: string) => value.length >= 8 },
  { key: "letter", label: "حرف إنجليزي واحد على الأقل", test: (value: string) => /[A-Za-z]/.test(value) },
  { key: "number", label: "رقم واحد على الأقل", test: (value: string) => /\d/.test(value) },
  { key: "symbol", label: "رمز خاص مثل ! @ # $", test: (value: string) => /[^A-Za-z0-9]/.test(value) },
] as const;

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function sanitizeSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+/, "");
}

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    slug: "",
    phone: "",
    plan: "MONTHLY",
  });

  const passwordState = useMemo(
    () => passwordRules.map((rule) => ({ ...rule, valid: rule.test(formData.password) })),
    [formData.password]
  );
  const isPasswordStrong = passwordState.every((rule) => rule.valid);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: prev.slug ? prev.slug : generateSlug(name),
    }));
    if (errors.name || errors.slug) {
      setErrors((prev) => ({ ...prev, name: "", slug: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordStrong) {
      setErrors((prev) => ({
        ...prev,
        password: "كلمة المرور يجب أن تحتوي على حروف وأرقام ورموز ولا تقل عن 8 أحرف.",
      }));
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.field) {
          setErrors({ [data.field]: data.error });
        } else if (data.errors) {
          setErrors(Object.fromEntries(Object.entries(data.errors).map(([key, value]) => [key, Array.isArray(value) ? value[0] : String(value)])));
        }
        toast.error(data.error || "فشل التسجيل");
        return;
      }

      toast.success("تم إنشاء الحساب بنجاح");
      router.push("/login?registered=true");
    } catch {
      toast.error("حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50" dir="rtl">
      <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
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
              <Store className="h-4 w-4" />
              إنشاء متجر جديد
            </div>
            <h1 className="text-4xl font-black leading-tight">
              ابدأ متجرك الإلكتروني باسم واضح ورابط يسهل مشاركته.
            </h1>
            <p className="mt-5 leading-8 text-slate-300">
              سجل بياناتك، اختر رابط المتجر، ثم انتقل للوحة التحكم لإضافة المنتجات وإدارة الطلبات.
            </p>
          </div>

          <div className="rounded-lg bg-white/10 p-5">
            <p className="text-sm font-bold text-teal-100">ما معنى slug؟</p>
            <p className="mt-2 leading-7 text-slate-300">
              هو الجزء المختصر من رابط متجرك ويكتب بالإنجليزية الصغيرة والأرقام والشرطة فقط.
            </p>
            <div className="mt-4 rounded-lg bg-white p-3 text-left font-mono text-sm font-bold text-slate-950" dir="ltr">
              your-domain.com/my-store
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="w-full max-w-2xl">
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
              <div className="mb-7 text-center">
                <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-lg border border-slate-200 bg-white shadow-sm">
                  <Image src="/logo.png" alt="SPIDERdev" width={48} height={48} className="object-contain" />
                </div>
                <h2 className="text-2xl font-black text-slate-950">إنشاء حساب جديد</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  أنشئ حساب مالك المتجر واختر رابطًا مختصرًا يعبر عن علامتك التجارية.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
                <Field label="الاسم الكامل" htmlFor="name" error={errors.name}>
                  <User className="field-icon" />
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={handleNameChange}
                    required
                    className="h-12 !pr-10"
                    placeholder="أحمد محمد"
                  />
                </Field>

                <Field label="البريد الإلكتروني" htmlFor="email" error={errors.email}>
                  <AtSign className="field-icon" />
                  <Input
                    id="email"
                    type="email"
                    dir="ltr"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, email: e.target.value }));
                      if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                    }}
                    required
                    className="h-12 !pr-10 text-left"
                    placeholder="name@example.com"
                  />
                </Field>

                <div className="md:col-span-2">
                  <Field label="رابط المتجر المختصر (slug)" htmlFor="slug" error={errors.slug}>
                    <Globe2 className="field-icon" />
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, slug: sanitizeSlug(e.target.value) }));
                        if (errors.slug) setErrors((prev) => ({ ...prev, slug: "" }));
                      }}
                      required
                      dir="ltr"
                      className="h-12 !pr-10 font-mono text-left"
                      placeholder="my-store"
                    />
                  </Field>
                  <div className="mt-2 rounded-lg border border-teal-100 bg-teal-50 p-3 text-sm leading-6 text-teal-900">
                    <strong>شرح slug:</strong> هو اسم الرابط الخاص بمتجرك. مثال: إذا كتبت{" "}
                    <code className="rounded bg-white px-1 font-mono" dir="ltr">my-store</code>{" "}
                    سيصبح رابط متجرك مثل{" "}
                    <code className="rounded bg-white px-1 font-mono" dir="ltr">your-domain.com/my-store</code>.
                  </div>
                </div>

                <Field label="رقم الهاتف (اختياري)" htmlFor="phone">
                  <Phone className="field-icon" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    className="h-12 !pr-10"
                    placeholder="+20 1xx xxxx xxx"
                  />
                </Field>

                <div>
                  <Label htmlFor="plan" className="text-slate-700">
                    الخطة
                  </Label>
                  <select
                    id="plan"
                    value={formData.plan}
                    onChange={(e) => setFormData((prev) => ({ ...prev, plan: e.target.value }))}
                    className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  >
                    <option value="MONTHLY">شهري</option>
                    <option value="SEMI_ANNUAL">نصف سنوي</option>
                    <option value="YEARLY">سنوي</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="password" className="text-slate-700">
                    كلمة المرور
                  </Label>
                  <div className="relative mt-2">
                    <Lock className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      dir="ltr"
                      value={formData.password}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, password: e.target.value }));
                        if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
                      }}
                      required
                      minLength={8}
                      className="h-12 !px-10 text-left"
                      placeholder="Example@123"
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
                  {errors.password && <p className="mt-1 text-sm font-medium text-red-600">{errors.password}</p>}
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {passwordState.map((rule) => (
                      <div
                        key={rule.key}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
                          rule.valid
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-50 text-slate-500"
                        }`}
                      >
                        {rule.valid ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                        {rule.label}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Button
                    type="submit"
                    className="h-12 w-full rounded-lg bg-teal-600 font-bold text-white [background-image:none] hover:bg-teal-700"
                    disabled={isLoading}
                  >
                    {isLoading ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
                    {!isLoading && <ArrowRight className="mr-2 h-4 w-4" />}
                  </Button>
                </div>
              </form>

              <p className="mt-6 text-center text-sm text-slate-600">
                لديك حساب بالفعل؟{" "}
                <Link href="/login" className="font-bold text-teal-700 hover:text-teal-800">
                  تسجيل الدخول
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>

      <style jsx global>{`
        .field-icon {
          pointer-events: none;
          position: absolute;
          right: 0.75rem;
          top: 50%;
          height: 1.25rem;
          width: 1.25rem;
          transform: translateY(-50%);
          color: rgb(148 163 184);
        }
      `}</style>
    </main>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor} className="text-slate-700">
        {label}
      </Label>
      <div className="relative mt-2">{children}</div>
      {error && <p className="mt-1 text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
