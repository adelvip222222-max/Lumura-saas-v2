import { Store, Clock } from "lucide-react";

interface Props {
  storeName: string;
}

export function StoreSuspended({ storeName }: Props) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FDFBF7] px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-100">
        <Store className="h-10 w-10 text-orange-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{storeName}</h1>
      <div className="flex items-center gap-2 text-amber-700 mb-4">
        <Clock className="h-5 w-5" />
        <span className="font-medium">المتجر غير متاح حالياً</span>
      </div>
      <p className="max-w-md text-muted-foreground text-sm leading-relaxed">
        انتهت صلاحية باقة هذا المتجر. يعمل مالك المتجر على تجديد الاشتراك — يرجى
        المحاولة لاحقاً.
      </p>
    </div>
  );
}
