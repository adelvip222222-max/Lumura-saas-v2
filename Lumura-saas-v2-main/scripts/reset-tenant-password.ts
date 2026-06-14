/**
 * Reset a tenant password by email.
 * Usage: npx tsx scripts/reset-tenant-password.ts email@example.com NewPassword123
 */
import "dotenv/config";
import { connectToDatabase } from "../src/lib/db/mongodb";
import Tenant from "../src/models/Tenant";
import { hashPassword } from "../src/lib/auth/password";

async function main() {
  const email = String(process.argv[2] ?? "").trim().toLowerCase();
  const password = String(process.argv[3] ?? "");

  if (!email || !password) {
    console.error("Usage: npx tsx scripts/reset-tenant-password.ts <email> <password>");
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  await connectToDatabase();

  const tenant = await Tenant.findOneAndUpdate(
    { email },
    { password: await hashPassword(password), status: "ACTIVE", isActive: true },
    { new: true }
  );

  if (!tenant) {
    console.error(`No tenant found for: ${email}`);
    process.exit(1);
  }

  console.log(`Password updated for ${email}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
