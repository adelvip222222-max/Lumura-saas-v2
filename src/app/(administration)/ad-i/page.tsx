import { redirect } from "next/navigation";
import { getAdministrationContext } from "@/lib/administration/context";

export default async function AdministrationGatewayPage() {
  const ctx = await getAdministrationContext();
  redirect(ctx.allowedRoutes[0].href);
}
