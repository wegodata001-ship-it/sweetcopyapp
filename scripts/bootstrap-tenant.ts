#!/usr/bin/env npx tsx
/**
 * Bootstrap a new tenant schema on Supabase/Postgres.
 *
 * Usage:
 *   npx tsx scripts/bootstrap-tenant.ts desigma
 *   TENANT_DB_SCHEMA=ameer npx tsx scripts/bootstrap-tenant.ts
 */

import { bootstrapTenantSchema, resolveTenantSchema } from "../src/lib/tenant";

async function main() {
  const argSchema = process.argv[2]?.trim();
  const schema = resolveTenantSchema(argSchema);

  console.log(`Bootstrapping tenant schema: ${schema}`);
  console.log("  → tables, indexes, triggers, RLS, grants, default roles");

  await bootstrapTenantSchema(schema);

  console.log(`Done. Expose "${schema}" in Supabase Dashboard → API → Exposed schemas.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
