import { auth } from "@/lib/auth";
import { SuperAdminHeader } from "@/components/super-admin/header";
import { TenantsTable } from "@/components/super-admin/tenants-table";

export default async function SuperAdminTenantsPage() {
  const session = await auth();

  return (
    <>
      <SuperAdminHeader
        user={session!.user}
        title="إدارة المستأجرين"
        description="تفعيل وإيقاف الحسابات وتعديل حدود الاشتراك"
      />
      <main className="flex-1 overflow-y-auto p-6">
        <TenantsTable />
      </main>
    </>
  );
}
