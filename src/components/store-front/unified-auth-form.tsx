// src/components/store-front/unified-auth-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Mail, Lock, User, Briefcase, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

interface UnifiedAuthFormProps {
  storeSlug: string;
  storeName: string;
  defaultTab?: "login" | "register";
  defaultType?: "customer" | "staff";
}

export function UnifiedAuthForm({ 
  storeSlug, 
  storeName, 
  defaultTab = "login",
  defaultType = "customer"
}: UnifiedAuthFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState<"customer" | "staff">(defaultType);
  const [activeTab, setActiveTab] = useState<"login" | "register">(defaultTab);
  
  // نماذج البيانات
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });
  
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });

  // ✅ تسجيل الدخول الموحد
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch("/api/auth/unified-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password,
          storeSlug,
          userType, // customer أو staff
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success(data.message || "تم تسجيل الدخول بنجاح");
        
        // توجيه حسب نوع المستخدم
        if (data.user?.role === "staff" || userType === "staff") {
          router.push(`/dashboard/stores/${storeSlug}`);
        } else {
          router.push(`/${storeSlug}/account`);
        }
        router.refresh();
      } else {
        toast.error(data.error || "فشل تسجيل الدخول");
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  // ✅ تسجيل عميل جديد
  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error("كلمة المرور غير متطابقة");
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch("/api/customer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registerForm.name,
          email: registerForm.email,
          password: registerForm.password,
          phone: registerForm.phone,
          storeSlug,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success("تم إنشاء الحساب بنجاح");
        router.push(`/${storeSlug}/account`);
        router.refresh();
      } else {
        toast.error(data.error || "فشل إنشاء الحساب");
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء إنشاء الحساب");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
      {/* ✅ اختيار نوع المستخدم */}
      <div className="flex gap-3 mb-6">
        <button
          type="button"
          onClick={() => setUserType("customer")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
            userType === "customer"
              ? "bg-orange-500 text-white shadow-md"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          عميل
        </button>
        <button
          type="button"
          onClick={() => setUserType("staff")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
            userType === "staff"
              ? "bg-orange-500 text-white shadow-md"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          موظف
        </button>
      </div>

      {/* ✅ نموذج تسجيل الدخول */}
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <Label className="text-gray-700 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            البريد الإلكتروني
          </Label>
          <Input
            type="email"
            placeholder="ahmed@example.com"
            value={loginForm.email}
            onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
            className="mt-1"
            required
          />
        </div>
        
        <div>
          <Label className="text-gray-700 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            كلمة المرور
          </Label>
          <Input
            type="password"
            placeholder="••••••••"
            value={loginForm.password}
            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
            className="mt-1"
            required
          />
        </div>
        
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "تسجيل الدخول"}
        </Button>
      </form>

      {/* ✅ فصل بين نماذج العملاء والموظفين */}
      {userType === "customer" && (
        <>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">أو</span>
            </div>
          </div>

          {/* ✅ تسجيل عميل جديد */}
          <form onSubmit={handleCustomerRegister} className="space-y-4">
            <div>
              <Label className="text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4" />
                الاسم الكامل
              </Label>
              <Input
                placeholder="أحمد محمد"
                value={registerForm.name}
                onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                className="mt-1"
                required
              />
            </div>
            
            <div>
              <Label className="text-gray-700 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                البريد الإلكتروني
              </Label>
              <Input
                type="email"
                placeholder="ahmed@example.com"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                className="mt-1"
                required
              />
            </div>
            
            <div>
              <Label className="text-gray-700">رقم الهاتف</Label>
              <Input
                type="tel"
                placeholder="0123456789"
                value={registerForm.phone}
                onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="text-gray-700">كلمة المرور</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                className="mt-1"
                required
              />
            </div>
            
            <div>
              <Label className="text-gray-700">تأكيد كلمة المرور</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={registerForm.confirmPassword}
                onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                className="mt-1"
                required
              />
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "إنشاء حساب جديد"}
            </Button>
          </form>
        </>
      )}

      {/* ✅ ملاحظة للموظفين */}
      {userType === "staff" && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
          <p className="font-medium">🔐 للموظفين فقط</p>
          <p className="text-xs mt-1">استخدم بيانات الدخول التي قدمها مدير المتجر لك</p>
        </div>
      )}
    </div>
  );
}