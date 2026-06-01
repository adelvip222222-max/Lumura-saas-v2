// src/app/dashboard/stores/[storeSlug]/orders/update-status-buttons.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { updateOrderStatus } from "@/actions/order-status";

interface UpdateStatusButtonsProps {
  storeSlug: string;
  orderId: string;
  statuses: string[];
}

// ✅ ألوان الأزرار حسب الحالة
const buttonStyles: Record<string, string> = {
  confirmed: "bg-blue-500 hover:bg-blue-600 text-white",
  processing: "bg-purple-500 hover:bg-purple-600 text-white",
  shipped: "bg-indigo-500 hover:bg-indigo-600 text-white",
  delivered: "bg-green-500 hover:bg-green-600 text-white",
  cancelled: "bg-red-500 hover:bg-red-600 text-white",
};

// ✅ تسميات الحالات
const statusLabels: Record<string, string> = {
  confirmed: "تأكيد",
  processing: "تجهيز",
  shipped: "شحن",
  delivered: "توصيل",
  cancelled: "إلغاء",
};

export function UpdateStatusButtons({ storeSlug, orderId, statuses }: UpdateStatusButtonsProps) {
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const router = useRouter();

  const handleUpdateStatus = async (newStatus: string) => {
    setLoadingStatus(newStatus);
    setErrorDetails(null);
    
    try {
      console.log("📤 Sending update:", { storeSlug, orderId, newStatus });
      
      // ✅ استدعاء Server Action
      const result = await updateOrderStatus(storeSlug, orderId, newStatus);
      
      console.log("📥 Server response:", result);

      if (result.success) {
        // ✅ نجاح التحديث
        toast.success(result.message, {
          duration: 3000,
          position: "bottom-right",
        });
        router.refresh();
      } else {
        // ✅ عرض رسالة الخطأ الفعلية من السيرفر
        const errorMessage = result.error || "حدث خطأ غير معروف";
        console.error("🔴 Update failed:", errorMessage);
        
        // ✅ عرض الخطأ في toast
        toast.error(errorMessage, {
          duration: 5000,
          position: "bottom-right",
          description: result.details ? JSON.stringify(result.details) : undefined,
        });
        
        // ✅ حفظ تفاصيل الخطأ للعرض
        setErrorDetails(errorMessage);
        
        // ✅ إزالة رسالة الخطأ بعد 5 ثواني
        setTimeout(() => setErrorDetails(null), 5000);
      }
    } catch (error: any) {
      // ✅ التعامل مع أخطاء الشبكة أو الأخطاء غير المتوقعة
      console.error("🔴 Network or unexpected error:", error);
      
      let errorMessage = "حدث خطأ أثناء تحديث الحالة";
      
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        errorMessage = "فشل الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت وتحديث الصفحة.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, {
        duration: 5000,
        position: "bottom-right",
      });
      
      setErrorDetails(errorMessage);
      setTimeout(() => setErrorDetails(null), 5000);
    } finally {
      setLoadingStatus(null);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      {/* ✅ أزرار تحديث الحالة */}
      <div className="flex items-center gap-1">
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => handleUpdateStatus(status)}
            disabled={loadingStatus !== null}
            className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
              buttonStyles[status] || "bg-gray-500 hover:bg-gray-600 text-white"
            } ${loadingStatus !== null ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {loadingStatus === status ? (
              <span className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                جاري...
              </span>
            ) : (
              statusLabels[status] || status
            )}
          </button>
        ))}
      </div>
      
      {/* ✅ عرض رسالة الخطأ تحت الأزرار */}
      {errorDetails && (
        <div className="flex items-start gap-1 text-red-600 text-xs mt-1 bg-red-50 p-2 rounded">
          <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
          <span>{errorDetails}</span>
        </div>
      )}
    </div>
  );
}