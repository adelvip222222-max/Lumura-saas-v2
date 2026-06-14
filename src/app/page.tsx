import { getPublicPlansAction } from "@/actions/plans";
import { HomeLanding } from "@/components/marketing/home-landing";

export default async function HomePage() {
  const result = await getPublicPlansAction();
  const plans = result.success && result.data ? result.data : [];

  return <HomeLanding plans={plans} />;
}
