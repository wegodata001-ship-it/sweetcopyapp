/**
 * Read-only: print which Supabase/Postgres project Prisma connects to.
 * No push, no migrate.
 */
import { readFileSync, existsSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

function maskUrl(raw: string | undefined): string {
  if (!raw) return "(not set)";
  try {
    const u = new URL(raw);
    if (u.password) u.password = "***";
    return u.toString();
  } catch {
    return raw.replace(/:([^:@/]+)@/, ":***@");
  }
}

function hostFromUrl(raw: string | undefined): string {
  if (!raw) return "(not set)";
  try {
    return new URL(raw).hostname;
  } catch {
    return "(parse error)";
  }
}

function refFromPostgresUrl(raw: string | undefined): string {
  if (!raw) return "(not set)";
  const m = raw.match(/postgres\.([a-z0-9]+):/i);
  if (m) return m[1];
  const m2 = raw.match(/@db\.([a-z0-9]+)\.supabase\.co/i);
  if (m2) return m2[1];
  return "(not in URL — pooler host only)";
}

function refFromSupabaseUrl(raw: string | undefined): string {
  if (!raw) return "(not set)";
  try {
    const host = new URL(raw).hostname;
    const m = host.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return m?.[1] ?? host;
  } catch {
    return "(parse error)";
  }
}

function refFromJwt(serviceKey: string | undefined): string {
  if (!serviceKey) return "(not set)";
  try {
    const payload = JSON.parse(
      Buffer.from(serviceKey.split(".")[1]!, "base64url").toString("utf8"),
    ) as { ref?: string };
    return payload.ref ?? "(no ref in JWT)";
  } catch {
    return "(JWT parse error)";
  }
}

function loadEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

async function main() {
  const dotEnv = loadEnvFile(".env");
  const dotLocal = loadEnvFile(".env.local");

  const databaseUrl = process.env.DATABASE_URL ?? dotEnv.DATABASE_URL ?? dotLocal.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL ?? dotEnv.DIRECT_URL ?? dotLocal.DIRECT_URL;
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    dotEnv.NEXT_PUBLIC_SUPABASE_URL ??
    dotLocal.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    dotEnv.SUPABASE_SERVICE_ROLE_KEY ??
    dotLocal.SUPABASE_SERVICE_ROLE_KEY;

  console.log("=== Connection report (read-only) ===\n");
  console.log("Prisma CLI loads: .env (not .env.local unless you export vars)\n");

  console.log("1. DATABASE_URL:", maskUrl(databaseUrl));
  console.log("2. DIRECT_URL:", maskUrl(directUrl));
  console.log("3. NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ?? "(not set)");
  console.log("4. Host (DATABASE_URL):", hostFromUrl(databaseUrl));
  console.log("5. Project Ref (from DATABASE_URL user):", refFromPostgresUrl(databaseUrl));
  console.log("   Project Ref (from NEXT_PUBLIC_SUPABASE_URL):", refFromSupabaseUrl(supabaseUrl));
  console.log("   Project Ref (from SERVICE_ROLE JWT):", refFromJwt(serviceKey));

  const prisma = new PrismaClient();
  try {
    const row = await prisma.$queryRaw<{ db: string; schema: string }[]>`
      SELECT current_database() AS db, current_schema() AS schema
    `;
    console.log("6. current_database():", row[0]?.db ?? "?");
    console.log("7. current_schema():", row[0]?.schema ?? "?");
  } catch (e) {
    console.log("6–7. SQL query failed (Prisma client / network):", String(e));
  } finally {
    await prisma.$disconnect();
  }

  const pgRef = refFromPostgresUrl(databaseUrl);
  const apiRef = refFromSupabaseUrl(supabaseUrl);
  const jwtRef = refFromJwt(serviceKey);
  if (pgRef !== apiRef || pgRef !== jwtRef) {
    console.log("\n⚠️  MISMATCH: Postgres URL points to one project; Supabase API/JWT point to another.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
