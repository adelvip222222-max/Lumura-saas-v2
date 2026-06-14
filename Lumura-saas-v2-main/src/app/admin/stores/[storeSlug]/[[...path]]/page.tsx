import { redirect } from "next/navigation";

interface Props {
  params: Promise<{
    storeSlug: string;
    path?: string[];
  }>;
}

export default async function AdminStoreAliasPage({ params }: Props) {
  const { storeSlug, path = [] } = await params;
  const suffix = path.length ? `/${path.join("/")}` : "";

  redirect(`/dashboard/stores/${storeSlug}${suffix}`);
}
