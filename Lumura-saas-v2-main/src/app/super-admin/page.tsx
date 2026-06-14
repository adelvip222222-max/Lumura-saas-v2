import { auth } from "@/lib/auth";
import { SuperAdminHeader } from "@/components/super-admin/header";
import { StatsOverview } from "@/components/super-admin/stats-overview";

export default async function SuperAdminHomePage() {
  const session = await auth();

  return (
    <>
      <SuperAdminHeader
        user={session!.user}
        title="نظرة عامة على المنصة"
        description="إحصائيات المستأجرين والاشتراكات والإيرادات"
      />
      <main className="flex-1 overflow-y-auto p-6">
        <StatsOverview />
      </main>
    </>
  );
}
