import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { StaffPanel } from "@/components/admin/staff-panel";

export const metadata: Metadata = {
  title: "فريق العمل | لوحة التحكم",
  description: "إدارة موظفي المتجر والصلاحيات",
};

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ storeSlug: string }>;
}

export default async function TeamPage({ params }: Props) {
  const { storeSlug } = await params;

  return (
    <div className="space-y-6">
      <PageHeader
        title="فريق العمل"
        description="أضف حتى 4 موظفين أو أكثر حسب الباقة، مع صلاحيات متعددة لكل موظف على أكثر من متجر"
      />
      <StaffPanel storeSlug={storeSlug} />
    </div>
  );
}