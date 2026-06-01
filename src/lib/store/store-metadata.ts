import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db/mongodb";
import Store from "@/models/Store";
import {
  buildStorePageMetadata,
  buildStorePublicTheme,
} from "@/lib/store/store-theme";

export async function getStoreMetadata(
  storeSlug: string,
  pageTitle?: string
): Promise<Metadata | null> {
  await connectToDatabase();
  const store = await Store.findOne({
    slug: storeSlug,
    isDeleted: false,
    isActive: true,
  }).lean();

  if (!store) return null;

  const theme = buildStorePublicTheme(store);
  return buildStorePageMetadata(store, theme, pageTitle);
}

export { buildStorePublicTheme };
