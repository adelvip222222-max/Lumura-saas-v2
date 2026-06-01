// src/app/unauthorized/page.tsx
import Link from "next/link";
import { Shield, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md p-8">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Shield className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">غير مصرح</h1>
        <p className="text-gray-600 mb-6">
          ليس لديك صلاحية للوصول إلى هذه الصفحة.
          يرجى التواصل مع المدير إذا كنت تعتقد أن هذا خطأ.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/dashboard">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              العودة للوحة التحكم
            </Button>
          </Link>
          <Link href="/">
            <Button className="bg-orange-500 hover:bg-orange-600 flex items-center gap-2">
              <Home className="w-4 h-4" />
              الرئيسية
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}