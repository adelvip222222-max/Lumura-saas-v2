export default function AdministrationLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" dir="rtl">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
        <p className="text-sm text-gray-500">جاري تحميل لوحة الإدارة...</p>
      </div>
    </div>
  );
}
