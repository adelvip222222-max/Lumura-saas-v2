"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdministrationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center" dir="rtl">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-red-50 text-red-500">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">
          تعذر تحميل صفحة الإدارة
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          حدث خطأ أثناء تجهيز البيانات. أعد المحاولة، وإذا تكرر الخطأ راجع
          رسالة الخادم أو صلاحيات الموظف.
        </p>
        <Button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600"
        >
          <RotateCcw className="h-4 w-4" />
          إعادة المحاولة
        </Button>
      </div>
    </div>
  );
}
