// src/app/dashboard/login/page.tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminLoginForm } from "@/components/admin/login-form";
import { LogIn, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "تسجيل الدخول | لوحة التحكم",
  description: "سجل دخولك إلى لوحة التحكم",
};

export default async function AdminLoginPage() {
  // Check if user is already logged in
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center px-4 py-12">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Header */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-lg">
              <LogIn className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">لوحة التحكم</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            إدارة متاجرك وتطويره بسهولة
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-border/50 bg-card/95 backdrop-blur-sm p-8 shadow-xl">
          <AdminLoginForm />
        </div>

        {/* Security Info */}
        <div className="mt-6 rounded-xl border border-amber-200/50 bg-amber-50/50 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-900 dark:text-amber-300">
              <p className="font-medium mb-1">معلومات الأمان</p>
              <p className="opacity-90">
                بيانات حسابك محمية بأعلى معايير الأمان والتشفير
              </p>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-6 flex justify-center gap-4 text-xs text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">
            شروط الاستخدام
          </a>
          <span>•</span>
          <a href="#" className="hover:text-foreground transition-colors">
            سياسة الخصوصية
          </a>
          <span>•</span>
          <a href="#" className="hover:text-foreground transition-colors">
            الدعم
          </a>
        </div>
      </div>
    </div>
  );
}
