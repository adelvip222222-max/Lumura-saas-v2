// src/app/dashboard/stores/[storeSlug]/orders/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { getAdminOrdersAction } from "@/actions/orders";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UpdateStatusButtons } from "./update-status-buttons";
import { 
  Package, 
  Search, 
  Eye,
  RefreshCw 
} from "lucide-react";

export const metadata: Metadata = {
  title: "الطلبات | لوحة التحكم",
  description: "إدارة طلبات المتجر",
};

interface Props {
  params: Promise<{ storeSlug: string }>;
  searchParams: Promise<{
    page?: string;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

// ✅ دوال مساعدة للتنسيق
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

// ✅ خريطة الحالات
const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "قيد الانتظار", color: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "مؤكد", color: "bg-blue-100 text-blue-800" },
  processing: { label: "قيد التجهيز", color: "bg-purple-100 text-purple-800" },
  shipped: { label: "تم الشحن", color: "bg-indigo-100 text-indigo-800" },
  delivered: { label: "تم التوصيل", color: "bg-green-100 text-green-800" },
  cancelled: { label: "ملغي", color: "bg-red-100 text-red-800" },
};

const paymentStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "معلق", color: "bg-yellow-100 text-yellow-800" },
  paid: { label: "مدفوع", color: "bg-green-100 text-green-800" },
  failed: { label: "فشل", color: "bg-red-100 text-red-800" },
  refunded: { label: "مسترجع", color: "bg-gray-100 text-gray-800" },
  cancelled: { label: "ملغي", color: "bg-red-100 text-red-800" },
};

// ✅ تحديد الحالات المتاحة للتحديث
function getNextStatuses(currentStatus: string): string[] {
  const statusFlow: Record<string, string[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: [],
  };
  return statusFlow[currentStatus] || [];
}

export default async function StoreOrdersPage({ params, searchParams }: Props) {
  const { storeSlug } = await params;
  const sp = await searchParams;

  const page = Number(sp.page) || 1;
  const status = sp.status;
  const search = sp.search;
  const startDate = sp.startDate;
  const endDate = sp.endDate;

  // ✅ استدعاء الدالة بشكل صحيح
  const result = await getAdminOrdersAction(storeSlug, {
    page,
    limit: 20,
    status,
    search,
    startDate,
    endDate,
  });

  if (!result.success) {
    return (
      <div className="p-8 text-center">
        <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">خطأ في تحميل الطلبات</h2>
        <p className="text-gray-500">{result.error}</p>
      </div>
    );
  }

  const { orders, pagination } = result.data;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الطلبات</h1>
          <p className="text-sm text-gray-500 mt-1">
            إجمالي الطلبات: {pagination.total}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" >
            <Link href={`/dashboard/stores/${storeSlug}/orders`}>
              <RefreshCw className="h-4 w-4 ml-2" />
              تحديث
            </Link>
          </Button>
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <form className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="ابحث برقم الطلب أو اسم العميل..."
              className="w-full pr-10 pl-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <select
            name="status"
            defaultValue={status}
            className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
          >
            <option value="">جميع الحالات</option>
            <option value="pending">قيد الانتظار</option>
            <option value="confirmed">مؤكد</option>
            <option value="processing">قيد التجهيز</option>
            <option value="shipped">تم الشحن</option>
            <option value="delivered">تم التوصيل</option>
            <option value="cancelled">ملغي</option>
          </select>
          <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
            <Search className="h-4 w-4 ml-2" />
            بحث
          </Button>
        </form>
      </div>

      {/* Orders Table */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد طلبات</h3>
          <p className="text-gray-500">
            {search || status 
              ? "لا توجد طلبات تطابق معايير البحث" 
              : "لم يتم إنشاء أي طلبات بعد"}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">رقم الطلب</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">العميل</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">المنتجات</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">الإجمالي</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">الحالة</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">الدفع</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">التاريخ</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">عرض</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">تحديث الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order: any) => {
                    const nextStatuses = getNextStatuses(order.status);
                    
                    return (
                      <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <Link 
                            href={`/dashboard/stores/${storeSlug}/orders/${order._id}`}
                            className="text-sm font-medium text-orange-600 hover:text-orange-700"
                          >
                            #{order.orderNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">
                            {order.shippingAddress?.fullName || "غير محدد"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {order.shippingAddress?.phone || ""}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">
                            {order.items?.length || 0} منتج
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(order.total)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={statusMap[order.status]?.color || "bg-gray-100"}>
                            {statusMap[order.status]?.label || order.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={paymentStatusMap[order.paymentStatus]?.color || "bg-gray-100"}>
                            {paymentStatusMap[order.paymentStatus]?.label || order.paymentStatus}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">
                            {formatDate(order.createdAt)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="sm" >
                            <Link href={`/dashboard/stores/${storeSlug}/orders/${order._id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </td>
<td className="px-4 py-3">
  {nextStatuses.length > 0 ? (
    <UpdateStatusButtons 
      storeSlug={storeSlug}
      orderId={order._id}
      statuses={nextStatuses}
    />
  ) : (
    <span className="text-xs text-gray-400">-</span>
  )}
</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((pageNum) => {
                const queryString = new URLSearchParams({
                  ...(status && { status }),
                  ...(search && { search }),
                  page: String(pageNum),
                }).toString();
                
                return (
                  <Link
                    key={pageNum}
                    href={`/dashboard/stores/${storeSlug}/orders?${queryString}`}
                    className={`px-3 py-1 rounded-md text-sm ${
                      pageNum === page
                        ? "bg-orange-500 text-white"
                        : "bg-white border text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}