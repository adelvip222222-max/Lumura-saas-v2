import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SuperAdminSidebar } from "@/components/super-admin/sidebar";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/super-admin");
  }

  if (session.user.role !== "super_admin") {
    redirect("/unauthorized");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50" dir="rtl">
      <SuperAdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
