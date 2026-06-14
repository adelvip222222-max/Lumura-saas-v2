"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/admin/form-field";
import { getSalesReportAction } from "@/actions/analytics";
import { formatCurrency } from "@/lib/utils";
import { Download, Calendar, Store, X, FileText, Loader2, Printer } from "lucide-react";

interface StoreOption {
  _id: string;
  name: string;
  slug: string;
}

interface Props {
  stores: StoreOption[];
}

export function SalesReportModal({ stores }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState("all");
  
  // Data
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    // Set default dates: start of current month to today
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const formatDateInput = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    setStartDate(formatDateInput(firstDay));
    setEndDate(formatDateInput(now));
  }, []);

  const handleFetchReport = async () => {
    if (!startDate || !endDate) {
      toast.error("يرجى اختيار الفترة الزمنية كاملة");
      return;
    }

    setLoading(true);
    try {
      const res = await getSalesReportAction(startDate, endDate, selectedStoreId);
      if (res.success && res.data) {
        setReportData(res.data);
        toast.success("تم توليد التقرير بنجاح");
      } else {
        toast.error(res.error ?? "فشل توليد التقرير");
      }
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ ما أثناء جلب البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!reportData) return;
    
    document.body.classList.add("printing-sales-report");
    window.print();
    
    // Cleanup class after print dialog finishes
    setTimeout(() => {
      document.body.classList.remove("printing-sales-report");
    }, 1000);
  };

  const selectedStoreName = selectedStoreId === "all" 
    ? "جميع المتاجر" 
    : (stores.find(s => s._id === selectedStoreId)?.name ?? "متجر غير معروف");

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="flex items-center gap-2 border-primary/20 hover:border-primary/50 text-foreground bg-background hover:bg-muted transition-colors rounded-2xl px-4 py-2 text-sm shadow-sm"
      >
        <FileText className="h-4 w-4 text-orange-500" />
        <span>تقرير المبيعات (PDF)</span>
      </Button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in no-print">
          <div className="w-full max-w-4xl rounded-3xl border border-muted bg-background shadow-2xl p-6 relative flex flex-col max-h-[90vh] overflow-hidden text-right rtl">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-orange-500" />
                <h3 className="text-lg font-bold text-foreground">تصدير تقرير المبيعات التفصيلي</h3>
              </div>
              <button 
                onClick={() => {
                  setIsOpen(false);
                  setReportData(null);
                }}
                className="rounded-full p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <FormField label="المتجر">
                <div className="relative">
                  <select
                    value={selectedStoreId}
                    onChange={(e) => {
                      setSelectedStoreId(e.target.value);
                      setReportData(null);
                    }}
                    className="flex h-10 w-full rounded-xl border border-input bg-background pr-10 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 capitalize"
                  >
                    <option value="all">جميع المتاجر</option>
                    {stores.map((s) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                  <Store className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground pointer-events-none" />
                </div>
              </FormField>

              <FormField label="من تاريخ">
                <div className="relative">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setReportData(null);
                    }}
                    className="pr-10"
                  />
                  <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground pointer-events-none" />
                </div>
              </FormField>

              <FormField label="إلى تاريخ">
                <div className="relative">
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setReportData(null);
                    }}
                    className="pr-10"
                  />
                  <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground pointer-events-none" />
                </div>
              </FormField>
            </div>

            {/* Fetch Button */}
            <div className="flex justify-end gap-3 mb-6 border-b pb-4">
              <Button
                onClick={handleFetchReport}
                disabled={loading}
                variant="primary"
                className="rounded-2xl px-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    جاري التحضير...
                  </>
                ) : (
                  "توليد التقرير المعاين"
                )}
              </Button>
            </div>

            {/* Report Preview */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-muted/20 rounded-2xl p-4">
              {reportData ? (
                <div className="space-y-6">
                  {/* Print Command Trigger */}
                  <div className="flex items-center justify-between bg-orange-50 border border-orange-200 dark:bg-orange-950/20 dark:border-orange-900/40 p-4 rounded-2xl">
                    <p className="text-sm text-orange-800 dark:text-orange-200 font-medium">
                      التقرير جاهز الآن للطباعة والتصدير كـ PDF. اضغط على زر التصدير أدناه لفتح واجهة الطباعة.
                    </p>
                    <Button
                      onClick={handlePrint}
                      className="rounded-xl flex items-center gap-1.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold"
                    >
                      <Printer className="h-4 w-4" />
                      طباعة وتصدير PDF
                    </Button>
                  </div>

                  {/* HTML Preview representation of PDF */}
                  <div className="border bg-card rounded-2xl p-6 space-y-6 shadow-sm max-w-3xl mx-auto border-muted text-foreground">
                    <div className="flex items-start justify-between border-b pb-4">
                      <div>
                        <h4 className="text-xl font-bold text-orange-600">منصة لومورا للـ SaaS</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">لوحة التحكم الإدارية للمستأجر</p>
                      </div>
                      <div className="text-left font-mono text-xs text-muted-foreground">
                        <p>تاريخ الإصدار: {new Date().toLocaleDateString("ar-EG")}</p>
                        <p>تاريخ الفلترة: {startDate} إلى {endDate}</p>
                        <p>المتجر: {selectedStoreName}</p>
                      </div>
                    </div>

                    <div className="text-center py-2">
                      <h2 className="text-xl font-extrabold tracking-tight">تقرير حجم المبيعات الإجمالي والمفصل</h2>
                    </div>

                    {/* Preview Totals */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="border bg-muted/30 p-4 rounded-xl text-center">
                        <p className="text-xs text-muted-foreground font-semibold">إجمالي الإيرادات</p>
                        <p className="text-lg font-bold text-green-600 mt-1">{formatCurrency(reportData.totalRevenue)}</p>
                      </div>
                      <div className="border bg-muted/30 p-4 rounded-xl text-center">
                        <p className="text-xs text-muted-foreground font-semibold">عدد الطلبات</p>
                        <p className="text-lg font-bold text-foreground mt-1">{reportData.totalOrders} طلب</p>
                      </div>
                      <div className="border bg-muted/30 p-4 rounded-xl text-center">
                        <p className="text-xs text-muted-foreground font-semibold">القطع المباعة</p>
                        <p className="text-lg font-bold text-blue-600 mt-1">{reportData.totalItemsSold} قطعة</p>
                      </div>
                      <div className="border bg-muted/30 p-4 rounded-xl text-center">
                        <p className="text-xs text-muted-foreground font-semibold">صافي الربح المتوقع</p>
                        <p className={`text-lg font-bold mt-1 ${reportData.totalProfit >= 0 ? "text-purple-600" : "text-red-500"}`}>
                          {formatCurrency(reportData.totalProfit)}
                        </p>
                      </div>
                    </div>

                    {/* Preview Table */}
                    <div className="border rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted text-muted-foreground font-medium">
                          <tr>
                            <th className="px-3 py-2.5 text-right font-medium">رقم الطلب</th>
                            <th className="px-3 py-2.5 text-right font-medium">المتجر</th>
                            <th className="px-3 py-2.5 text-right font-medium">العميل</th>
                            <th className="px-3 py-2.5 text-right font-medium">التاريخ</th>
                            <th className="px-3 py-2.5 text-right font-medium">الحالة</th>
                            <th className="px-3 py-2.5 text-left font-medium">القيمة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {reportData.orders.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                                لا توجد مبيعات في هذه الفترة المحددة
                              </td>
                            </tr>
                          ) : (
                            reportData.orders.map((order: any) => (
                              <tr key={order._id} className="hover:bg-muted/10">
                                <td className="px-3 py-2 font-mono text-xs">{order.orderNumber}</td>
                                <td className="px-3 py-2 font-medium">{order.storeName}</td>
                                <td className="px-3 py-2 text-xs text-muted-foreground truncate max-w-[120px]" title={order.customerName}>
                                  {order.customerName}
                                </td>
                                <td className="px-3 py-2 text-xs text-muted-foreground">
                                  {new Date(order.createdAt).toLocaleDateString("ar-EG")}
                                </td>
                                <td className="px-3 py-2 text-xs">
                                  <span className="inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-[10px] capitalize">
                                    {order.status}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-left font-semibold">{formatCurrency(order.total)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FileText className="h-16 w-16 text-muted-foreground/30 mb-3 animate-pulse" />
                  <p className="font-semibold text-muted-foreground">لم يتم توليد أي تقرير بعد</p>
                  <p className="text-xs text-muted-foreground/80 mt-1 max-w-sm">
                    اختر معايير التصفية كالمتجر والفترة الزمنية بالأعلى ثم انقر على "توليد التقرير المعاين"
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Styled Printable Portal Content */}
      {mounted && reportData && createPortal(
        <div id="sales-report-print-area" className="hidden print:block bg-white text-black p-8 font-sans w-full min-h-screen text-right rtl">
          <style>{`
            @media print {
              body > *:not(#sales-report-print-area) {
                display: none !important;
              }
              #sales-report-print-area {
                display: block !important;
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                background: white !important;
                color: black !important;
                direction: rtl !important;
                text-align: right !important;
              }
              .print-no-border {
                border: none !important;
              }
              .table-bordered {
                border-collapse: collapse;
                width: 100%;
              }
              .table-bordered th, .table-bordered td {
                border: 1px solid #ddd !important;
                padding: 8px !important;
              }
              .table-bordered th {
                background-color: #f5f5f5 !important;
              }
            }
          `}</style>
          
          {/* Print Header */}
          <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
            <div>
              <h1 className="text-2xl font-extrabold text-black">منصة لومورا - تقرير المبيعات التفصيلي</h1>
              <p className="text-sm text-gray-600 mt-1">التقرير الإداري للمستأجر</p>
            </div>
            <div className="text-left text-xs font-mono text-gray-700">
              <p>تاريخ الطباعة: {new Date().toLocaleDateString("ar-EG")} - {new Date().toLocaleTimeString("ar-EG")}</p>
              <p>الفترة المشمولة: {startDate} إلى {endDate}</p>
              <p>المتجر المحدد: {selectedStoreName}</p>
            </div>
          </div>

          <div className="text-center my-6">
            <h2 className="text-xl font-bold underline">ملخص حجم المبيعات والأداء المالي</h2>
          </div>

          {/* Financial Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="border border-gray-400 p-4 rounded-xl text-center">
              <p className="text-xs text-gray-600 font-bold">إجمالي المبيعات (الإيرادات)</p>
              <p className="text-lg font-bold text-black mt-2">{formatCurrency(reportData.totalRevenue)}</p>
            </div>
            <div className="border border-gray-400 p-4 rounded-xl text-center">
              <p className="text-xs text-gray-600 font-bold">عدد الطلبات الإجمالي</p>
              <p className="text-lg font-bold text-black mt-2">{reportData.totalOrders} طلب</p>
            </div>
            <div className="border border-gray-400 p-4 rounded-xl text-center">
              <p className="text-xs text-gray-600 font-bold">القطع والمنتجات المباعة</p>
              <p className="text-lg font-bold text-black mt-2">{reportData.totalItemsSold} قطعة</p>
            </div>
            <div className="border border-gray-400 p-4 rounded-xl text-center">
              <p className="text-xs text-gray-600 font-bold">صافي الأرباح المحققة</p>
              <p className="text-lg font-bold text-black mt-2">{formatCurrency(reportData.totalProfit)}</p>
            </div>
          </div>

          <h3 className="text-md font-bold mb-3">تفاصيل المبيعات الفردية:</h3>

          {/* Orders Table */}
          <table className="table-bordered w-full text-xs">
            <thead>
              <tr>
                <th className="text-right">#</th>
                <th className="text-right">رقم الطلب</th>
                <th className="text-right">اسم المتجر</th>
                <th className="text-right">العميل</th>
                <th className="text-right">التاريخ</th>
                <th className="text-right">الحالة</th>
                <th className="text-right">طريقة الدفع</th>
                <th className="text-right">المنتجات المباعة</th>
                <th className="text-left">المجموع</th>
              </tr>
            </thead>
            <tbody>
              {reportData.orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-6">
                    لا توجد طلبات مسجلة لهذه الفترة
                  </td>
                </tr>
              ) : (
                reportData.orders.map((order: any, idx: number) => (
                  <tr key={order._id}>
                    <td>{idx + 1}</td>
                    <td className="font-mono">{order.orderNumber}</td>
                    <td>{order.storeName}</td>
                    <td>{order.customerName}</td>
                    <td>{new Date(order.createdAt).toLocaleDateString("ar-EG")}</td>
                    <td>{order.status}</td>
                    <td>{order.paymentMethod}</td>
                    <td className="text-gray-700 max-w-[200px] truncate">{order.itemsList}</td>
                    <td className="text-left font-bold">{formatCurrency(order.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Signatures */}
          <div className="mt-16 pt-8 border-t border-gray-300 flex justify-between text-sm">
            <div>
              <p>توقيع مسؤول المنصة:</p>
              <div className="mt-8 border-b border-gray-400 w-48"></div>
            </div>
            <div className="text-left">
              <p>توقيع الإدارة المالية:</p>
              <div className="mt-8 border-b border-gray-400 w-48"></div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
