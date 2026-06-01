import { auth } from "@/lib/auth";
import { SuperAdminHeader } from "@/components/super-admin/header";
import { PaymentProofsTable } from "@/components/super-admin/payment-proofs-table";

export default async function SuperAdminPaymentProofsPage() {
  const session = await auth();

  return (
    <>
      <SuperAdminHeader
        user={session!.user}
        title="إثباتات الدفع"
        description="مراجعة واعتماد مدفوعات المستأجرين"
      />
      <main className="flex-1 overflow-y-auto p-6">
        <PaymentProofsTable />
      </main>
    </>
  );
}
