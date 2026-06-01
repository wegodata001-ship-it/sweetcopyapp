#!/usr/bin/env npx tsx
/**
 * DEMO-only: full reset of the `hlwait` schema on Supabase project khwwxynldoimdrnecfan.
 *   - Drops ALL objects in `public` schema (tables, views, functions, triggers, policies).
 *   - Creates / syncs all `hlwait.*` tables via prisma db push.
 *   - Seeds demo data.
 *
 * SAFETY: Refuses to run against any project other than ALLOWED_DEMO_REF.
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

const ALLOWED_DEMO_REF = "khwwxynldoimdrnecfan";

// ── env loader ────────────────────────────────────────────────────────────────

function loadEnvFile(name: string, override = false): void {
  const path = resolve(process.cwd(), name);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (override || !(key in process.env)) process.env[key] = val;
  }
}
loadEnvFile(".env");
loadEnvFile(".env.local", true);

// ── safety check ──────────────────────────────────────────────────────────────

function extractRef(url: string | undefined): string | null {
  if (!url) return null;
  const pg = url.match(/postgres\.([a-z0-9]+):/i);
  if (pg?.[1]) return pg[1].toLowerCase();
  try {
    const host = new URL(url.replace(/\/rest\/v1\/?$/i, "")).hostname;
    const m = host.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return m?.[1]?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

function assertDemoProjectOnly(): void {
  const BLOCKED = ["qileqmeisvibtkvpigct"];
  const refs = new Set<string>();
  for (const u of [process.env.DATABASE_URL, process.env.DIRECT_URL, process.env.NEXT_PUBLIC_SUPABASE_URL]) {
    const r = extractRef(u);
    if (r) refs.add(r);
  }
  for (const r of refs) {
    if (BLOCKED.includes(r)) throw new Error(`🚫 Refusing: blocked production ref "${r}".`);
    if (r !== ALLOWED_DEMO_REF) throw new Error(`🚫 Refusing: expected DEMO ref "${ALLOWED_DEMO_REF}", got "${r}". Fix .env.local.`);
  }
  if (!refs.has(ALLOWED_DEMO_REF))
    throw new Error(`🚫 Cannot detect DEMO project ref "${ALLOWED_DEMO_REF}" in DATABASE_URL / SUPABASE_URL.`);
  console.log(`✓ Target confirmed: DEMO project ${ALLOWED_DEMO_REF}`);
}

// ── helpers ───────────────────────────────────────────────────────────────────

function run(cmd: string) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: process.cwd(), env: process.env });
}

// ── public schema wipe ────────────────────────────────────────────────────────

async function wipePublicSchema(prisma: PrismaClient): Promise<void> {
  console.log("\n── Wiping public schema ──────────────────────────────────────");

  // Drop all tables in public (cascades views, fk constraints)
  await prisma.$executeRawUnsafe(`
    DO $$ DECLARE r RECORD; BEGIN
      FOR r IN (
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
      ) LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
        RAISE NOTICE 'Dropped table: %', r.tablename;
      END LOOP;
    END $$;
  `);

  // Drop all views in public
  await prisma.$executeRawUnsafe(`
    DO $$ DECLARE r RECORD; BEGIN
      FOR r IN (
        SELECT viewname FROM pg_views WHERE schemaname = 'public'
      ) LOOP
        EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.viewname) || ' CASCADE';
      END LOOP;
    END $$;
  `);

  // Drop all functions/procedures in public
  await prisma.$executeRawUnsafe(`
    DO $$ DECLARE r RECORD; BEGIN
      FOR r IN (
        SELECT p.oid, p.proname,
               pg_catalog.pg_get_function_identity_arguments(p.oid) AS args
        FROM pg_catalog.pg_proc p
        JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
      ) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.proname) || '(' || r.args || ') CASCADE';
      END LOOP;
    END $$;
  `);

  // Drop all sequences in public
  await prisma.$executeRawUnsafe(`
    DO $$ DECLARE r RECORD; BEGIN
      FOR r IN (
        SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public'
      ) LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS public.' || quote_ident(r.sequence_name) || ' CASCADE';
      END LOOP;
    END $$;
  `);

  // Drop all types in public
  await prisma.$executeRawUnsafe(`
    DO $$ DECLARE r RECORD; BEGIN
      FOR r IN (
        SELECT typname FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public' AND t.typtype = 'e'
      ) LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
      END LOOP;
    END $$;
  `);

  const remaining = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `;
  console.log(`✓ public schema wiped. Tables remaining: ${remaining.length}`);
}

// ── table report ──────────────────────────────────────────────────────────────

async function reportHlwait(prisma: PrismaClient): Promise<void> {
  const tables = await prisma.$queryRaw<{ table_name: string; row_count: bigint }[]>`
    SELECT
      t.table_name,
      COALESCE((
        SELECT reltuples::bigint
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'hlwait' AND c.relname = t.table_name
      ), 0) AS row_count
    FROM information_schema.tables t
    WHERE t.table_schema = 'hlwait' AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name
  `;

  console.log("\n══════════════════════════════════════════════");
  console.log("  Schema: hlwait");
  console.log("  Tables:");
  for (const t of tables) {
    console.log(`    hlwait.${t.table_name}`);
  }
  console.log(`  Total: ${tables.length} tables`);

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/rest\/v1\/?$/, "") ??
    `https://${ALLOWED_DEMO_REF}.supabase.co`;
  console.log(`  Supabase: ${supabaseUrl}`);
  console.log("══════════════════════════════════════════════\n");
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║   DEMO hlwait FULL RESET                 ║");
  console.log("╚══════════════════════════════════════════╝\n");

  assertDemoProjectOnly();

  const prisma = new PrismaClient();

  try {
    await wipePublicSchema(prisma);
  } finally {
    await prisma.$disconnect();
  }

  run("npx prisma generate");
  run("npx prisma db push --accept-data-loss");
  run("npx prisma db seed");

  const prisma2 = new PrismaClient();
  try {
    await reportHlwait(prisma2);
  } finally {
    await prisma2.$disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
