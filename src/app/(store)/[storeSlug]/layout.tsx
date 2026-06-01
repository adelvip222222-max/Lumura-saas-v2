import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db/mongodb";
import Store from "@/models/Store";
import { syncStoreSubscriptionBySlug } from "@/services/subscription.service";
import { getStoreMetadata } from "@/lib/store/store-metadata";
import { buildStorePublicTheme } from "@/lib/store/store-theme";
import { serializeMongoDoc } from "@/lib/utils/serialize";
import { StoreThemeShell } from "@/components/store-front/store-theme-shell";
import { StoreInnerCoverStrip } from "@/components/store-front/store-inner-cover-strip";
import { StoreHeader } from "@/components/store-front/store-header";
import { StoreFooter } from "@/components/store-front/store-footer";
import { StoreSuspended } from "@/components/store-front/store-suspended";
import "../store-front.css";

import "@/models";

interface Props {
  children: React.ReactNode;
  params: Promise<{ storeSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { storeSlug } = await params;
  const meta = await getStoreMetadata(storeSlug);
  return meta ?? { title: "متجر غير متاح" };
}

export default async function StoreLayout({ children, params }: Props) {
  const { storeSlug } = await params;

  await connectToDatabase();
  const storeDoc = await Store.findOne({ slug: storeSlug, isDeleted: false }).lean();
  if (!storeDoc) notFound();

  const subscriptionState = await syncStoreSubscriptionBySlug(storeSlug);
  const refreshed = await Store.findById(storeDoc._id).lean();

  if (!refreshed?.isActive || subscriptionState?.isExpired) {
    return <StoreSuspended storeName={storeDoc.name} />;
  }

  const theme = buildStorePublicTheme(
    serializeMongoDoc(refreshed) as Parameters<typeof buildStorePublicTheme>[0]
  );

  return (
    <StoreThemeShell theme={theme}>
      <StoreHeader theme={theme} />
      <StoreInnerCoverStrip theme={theme} />
      <main className="flex-1">{children}</main>
      <StoreFooter theme={theme} />
    </StoreThemeShell>
  );
}
