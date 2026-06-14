/**
 * Backfill store subscriptions for existing stores without one.
 * Run: npx tsx scripts/backfill-store-subscriptions.ts
 */
import "dotenv/config";
import { connectToDatabase } from "../src/lib/db/mongodb";
import Store from "../src/models/Store";
import Tenant from "../src/models/Tenant";
import {
  ensureDefaultPlans,
  createStoreSubscription,
} from "../src/services/subscription.service";

async function main() {
  await connectToDatabase();
  await ensureDefaultPlans();

  const stores = await Store.find({ isDeleted: false }).lean();
  let created = 0;

  for (const store of stores) {
    const tenant = await Tenant.findById(store.tenantId).select("_id").lean();
    if (!tenant) continue;

    try {
      await createStoreSubscription({
        userId: tenant._id.toString(),
        storeId: store._id.toString(),
        planName: "free",
        trialDays: 14,
      });
      created++;
      console.log(`✓ ${store.slug}`);
    } catch {
      console.log(`— ${store.slug} (already exists)`);
    }
  }

  console.log(`\nDone. Processed ${stores.length} stores, created ${created} subscriptions.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
