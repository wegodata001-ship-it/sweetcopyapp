#!/usr/bin/env npx tsx
/**
 * One-shot DEMO environment setup (separate Supabase project).
 *
 * Prerequisites:
 *   1. Copy .env.demo.example → .env.local with DEMO Supabase credentials
 *   2. Set DEMO_BLOCKED_SUPABASE_REFS to your production project ref(s)
 *
 * Usage:
 *   npm run demo:setup
 */

import { execSync } from "node:child_process";

function run(cmd: string) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: process.cwd(), env: process.env });
}

async function main() {
  console.log("=== Sweet Demo Setup ===\n");

  console.log(
    "\n1/3 Prisma: reset + push public tables — DEMO DB only, all data replaced...",
  );
  console.log("    Do NOT use `prisma migrate dev` on demo — use this script instead.\n");
  run("npx prisma db push --force-reset --skip-generate");
  run("npx prisma generate");

  console.log("\n2/3 Prisma: seed demo users + sample inventory...");
  run("npx prisma db seed");

  console.log(
    "\n3/3 Apply Supabase migrations (demo seed SQL) if using Supabase CLI:",
  );
  console.log("   supabase db push");
  console.log("   — or run SQL files in supabase/migrations/ via SQL Editor\n");

  console.log("=== Done ===");
  console.log("Login (identifier = fullName, nationalId, or email):");
  console.log("  superadmin — 100000018 or superadmin / Admin123!  (SUPER_ADMIN)");
  console.log("  admin      — admin / Admin123!                    (ADMIN)");
  console.log("  employee   — employee / Employee123!              (EMPLOYEE)");
  console.log("Start app: npm run dev");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
