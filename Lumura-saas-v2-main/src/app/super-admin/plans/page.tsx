import { auth } from "@/lib/auth";
import { SuperAdminHeader } from "@/components/super-admin/header";
import { PlansManager } from "@/components/super-admin/plans-manager";

export default async function SuperAdminPlansPage() {
  const session = await auth();

  return (
    <>
      <SuperAdminHeader
        user={session!.user}
        title="خطط الدفع والعروض"
        description="تعديل الأسعار والمميزات المعروضة للعملاء"
      />
      <main className="flex-1 overflow-y-auto p-6">
        <PlansManager />
      </main>
    </>
  );
}
