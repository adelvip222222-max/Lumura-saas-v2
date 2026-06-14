"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Eye, EyeOff, Lock, Mail, Phone, User, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  storeSlug: string;
  storeName: string;
  defaultTab?: "login" | "register";
}

const passwordRules = [
  { key: "length", label: "8 أحرف", test: (value: string) => value.length >= 8 },
  { key: "letter", label: "حرف", test: (value: string) => /[A-Za-z]/.test(value) },
  { key: "number", label: "رقم", test: (value: string) => /\d/.test(value) },
  { key: "symbol", label: "رمز", test: (value: string) => /[^A-Za-z0-9]/.test(value) },
] as const;

export function CustomerAuthForm({ storeSlug, storeName, defaultTab = "login" }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">(defaultTab);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  const passwordState = useMemo(
    () => passwordRules.map((rule) => ({ ...rule, valid: rule.test(form.password) })),
    [form.password]
  );
  const isPasswordStrong = passwordState.every((rule) => rule.valid);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (tab === "register" && !isPasswordStrong) {
      toast.error("كلمة المرور يجب أن تحتوي على حروف وأرقام ورموز");
      return;
    }

    setLoading(true);
    try {
      const url = tab === "login" ? "/api/customer/login" : "/api/customer/register";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, storeSlug }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "فشلت العملية");
        return;
      }
      toast.success(tab === "login" ? "مرحبًا بعودتك" : "تم إنشاء حسابك");
      router.push(`/${storeSlug}/account`);
      router.refresh();
    } catch {
      toast.error("حدث خطأ. يرجى المحاولة مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 sm:p-6">
      <div className="mb-5 rounded-lg bg-slate-50 p-1">
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            className={`h-11 rounded-md text-sm font-bold transition ${
            tab === "login" ? "store-btn-primary shadow-sm" : "text-slate-500 hover:bg-white"
            }`}
            onClick={() => setTab("login")}
          >
            دخول العملاء
          </button>
          <button
            type="button"
            className={`h-11 rounded-md text-sm font-bold transition ${
            tab === "register" ? "store-btn-primary shadow-sm" : "text-slate-500 hover:bg-white"
            }`}
            onClick={() => setTab("register")}
          >
            حساب جديد
          </button>
        </div>
      </div>

      <div className="mb-5 text-center">
        <h2 className="text-lg font-black text-slate-950">
          {tab === "login" ? "تسجيل دخول العملاء" : "إنشاء حساب عميل"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          حسابك مخصص للتسوق ومتابعة طلباتك داخل متجر {storeName}.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {tab === "register" && (
          <>
            <div>
              <Label htmlFor="customer-name">الاسم الكامل</Label>
              <div className="relative mt-2">
                <User className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  id="customer-name"
                  placeholder="أحمد محمد"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-12 !pr-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="customer-phone">رقم الهاتف (اختياري)</Label>
              <div className="relative mt-2">
                <Phone className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  id="customer-phone"
                  placeholder="+20 1xx xxxx xxx"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="h-12 !pr-10"
                  dir="ltr"
                />
              </div>
            </div>
          </>
        )}

        <div>
          <Label htmlFor="customer-email">البريد الإلكتروني</Label>
          <div className="relative mt-2">
            <Mail className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              id="customer-email"
              type="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="h-12 !pr-10 text-left"
              required
              dir="ltr"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="customer-password">كلمة المرور</Label>
          <div className="relative mt-2">
            <Lock className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              id="customer-password"
              type={showPassword ? "text" : "password"}
              placeholder="Example@123"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="h-12 !px-10 text-left"
              required
              minLength={tab === "register" ? 8 : undefined}
              dir="ltr"
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

          {tab === "register" && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {passwordState.map((rule) => (
                <div
                  key={rule.key}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${
                    rule.valid ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-500"
                  }`}
                >
                  {rule.valid ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  {rule.label}
                </div>
              ))}
            </div>
          )}
        </div>

        <Button type="submit" className="h-12 w-full store-btn-primary font-bold" loading={loading}>
          {tab === "login" ? "دخول إلى حسابي" : "إنشاء حساب عميل"}
        </Button>
      </form>
    </div>
  );
}
