// src/app/verify/page.tsx (أو في نفس صفحة التسجيل)
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    
    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    
    const data = await res.json();
    
    if (res.ok) {
      setMessage("تم التحقق بنجاح! جاري تحويلك إلى صفحة تسجيل الدخول...");
      setTimeout(() => {
        router.push("/login?verified=true");
      }, 2000);
    } else {
      setError(data.error);
    }
    
    setLoading(false);
  };

  const handleResend = async () => {
    setLoading(true);
    const res = await fetch("/api/auth/resend-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    
    if (res.ok) {
      setMessage("تم إرسال رمز جديد إلى بريدك الإلكتروني");
    } else {
      setError("فشل إرسال الرمز. يرجى المحاولة مرة أخرى");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-orange-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">تحقق من بريدك الإلكتروني</h2>
          <p className="mt-2 text-gray-600">
            قمنا بإرسال رمز التحقق إلى<br />
            <strong className="text-orange-600">{email}</strong>
          </p>
        </div>
        
        {message && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 text-sm text-center">{message}</p>
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              رمز التحقق
            </label>
            <Input
              type="text"
              placeholder="أدخل الرمز المكون من 6 أرقام"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="text-center text-2xl tracking-widest py-6"
              maxLength={6}
              required
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={loading || code.length !== 6}
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            {loading ? <Loader2 className="animate-spin" /> : "تحقق"}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <button
            onClick={handleResend}
            disabled={loading}
            className="text-sm text-orange-600 hover:text-orange-700"
          >
            إعادة إرسال الرمز
          </button>
        </div>
      </div>
    </div>
  );
}
