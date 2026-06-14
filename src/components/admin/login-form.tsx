"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { AuthErrorCode, getAuthErrorMessage, GENERIC_AUTH_ERROR } from "@/lib/auth/auth-errors";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validate inputs
      if (!email || !password) {
        setError("البريد الإلكتروني وكلمة المرور مطلوبان");
        setIsLoading(false);
        return;
      }

      // Sign in
      const result = await signIn("credentials", {
        email: email.toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        // Map error codes to user-friendly messages
        const errorCode = result.error as AuthErrorCode;

        if (Object.values(AuthErrorCode).includes(errorCode)) {
          setError(getAuthErrorMessage(errorCode));
        } else {
          setError(GENERIC_AUTH_ERROR);
        }

        toast.error(getAuthErrorMessage(errorCode as AuthErrorCode) || "فشل تسجيل الدخول");
        return;
      }

      // Success
      toast.success("تم تسجيل الدخول بنجاح");

      // Redirect
      let callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
      if (!callbackUrl.startsWith("/") || callbackUrl.startsWith("//") || callbackUrl.startsWith("/\\")) {
        callbackUrl = "/dashboard";
      }
      setTimeout(() => {
        router.push(callbackUrl);
        router.refresh();
      }, 500);
    } catch (err) {
      const message = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
      setError(GENERIC_AUTH_ERROR);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5">
      {/* Error Alert */}
      {error && (
        <div className="rounded-xl border border-red-200/50 bg-red-50/80 p-4 dark:border-red-900/30 dark:bg-red-950/20">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Email Field */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">البريد الإلكتروني</label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            disabled={isLoading}
            className="pl-10"
            dir="ltr"
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">كلمة المرور</label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            disabled={isLoading}
            className="pl-10 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Remember Me */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border border-input accent-primary"
          disabled={isLoading}
        />
        <span className="text-sm text-muted-foreground">تذكرني في هذا الجهاز</span>
      </label>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading || !email || !password}
        className="w-full h-11 gap-2"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            جاري الدخول...
          </>
        ) : (
          <>
            دخول
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>

      {/* Forgot Password Link */}
      <div className="text-center">
        <Link
          href="/auth/forgot-password"
          className="text-sm text-primary hover:underline transition-colors"
        >
          هل نسيت كلمة المرور؟
        </Link>
      </div>

      {/* Signup Link */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">أو</span>
        </div>
      </div>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">ليس لديك حساب؟ </span>
        <Link
          href="/auth/register"
          className="font-medium text-primary hover:underline transition-colors"
        >
          أنشئ حسابك الآن
        </Link>
      </div>
    </form>
  );
}
