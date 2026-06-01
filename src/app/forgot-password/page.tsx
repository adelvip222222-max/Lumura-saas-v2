"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Mail,
  Lock,
  AlertCircle,
  ArrowRight,
  KeyRound,
} from "lucide-react";

type Step = "email" | "reset";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") ?? "";

  const [step, setStep] = useState<Step>(initialEmail ? "reset" : "email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "حدث خطأ");
        setLoading(false);
        return;
      }

      setMessage(data.message ?? "تحقق من بريدك الإلكتروني");
      if (process.env.NODE_ENV === "development" && data.debugCode) {
        setMessage(
          `${data.message} (تطوير: الرمز ${data.debugCode})`
        );
      }
      setStep("reset");
      router.replace(`/forgot-password?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch {
      setError("حدث خطأ غير متوقع");
    }

    setLoading(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code,
          password,
          confirmPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "فشل إعادة التعيين");
        setLoading(false);
        return;
      }

      setMessage("تم تغيير كلمة المرور! جاري تحويلك...");
      setTimeout(() => {
        router.push("/login?reset=success");
      }, 1500);
    } catch {
      setError("حدث خطأ غير متوقع");
    }

    setLoading(false);
  };

  const handleResend = async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
    const data = await res.json();
    if (res.ok) {
      let msg = data.message ?? "تم إرسال رمز جديد";
      if (process.env.NODE_ENV === "development" && data.debugCode) {
        msg += ` (تطوير: ${data.debugCode})`;
      }
      setMessage(msg);
    } else {
      setError(data.error ?? "فشل الإرسال");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white py-12 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            {step === "email" ? (
              <KeyRound className="w-8 h-8 text-white" />
            ) : (
              <Lock className="w-8 h-8 text-white" />
            )}
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {step === "email" ? "نسيت كلمة المرور؟" : "كلمة مرور جديدة"}
          </h2>
          <p className="mt-2 text-gray-500">
            {step === "email"
              ? "أدخل بريدك وسنرسل لك رمزاً لإعادة التعيين"
              : (
                <>
                  أدخل الرمز المرسل إلى{" "}
                  <strong className="text-orange-600">{email}</strong>
                </>
              )}
          </p>
        </div>

        {message && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm text-center">{message}</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {step === "email" ? (
          <form onSubmit={handleSendCode} className="space-y-5">
            <div>
              <Label className="text-gray-700">البريد الإلكتروني</Label>
              <div className="relative mt-1">
                <Mail className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="email"
                  className="pr-10 py-3"
                  placeholder="ahmed@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3"
            >
              {loading ? (
                <Loader2 className="animate-spin mx-auto" />
              ) : (
                "إرسال رمز إعادة التعيين"
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <Label>رمز التحقق (6 أرقام)</Label>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="text-center text-2xl tracking-widest py-4 mt-1"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                required
              />
            </div>

            <div>
              <Label>كلمة المرور الجديدة</Label>
              <div className="relative mt-1">
                <Lock className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="password"
                  className="pr-10 py-3"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                8 أحرف على الأقل، حرف كبير وصغير ورقم
              </p>
            </div>

            <div>
              <Label>تأكيد كلمة المرور</Label>
              <div className="relative mt-1">
                <Lock className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="password"
                  className="pr-10 py-3"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3"
            >
              {loading ? (
                <Loader2 className="animate-spin mx-auto" />
              ) : (
                "حفظ كلمة المرور"
              )}
            </Button>

            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              className="w-full text-sm text-orange-600 hover:text-orange-700"
            >
              إعادة إرسال الرمز
            </button>
          </form>
        )}

        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-orange-600"
          >
            <ArrowRight className="h-4 w-4" />
            العودة لتسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
}
