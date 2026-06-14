import { Suspense } from "react";

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-orange-50">
          <p className="text-gray-500">جاري التحميل...</p>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
