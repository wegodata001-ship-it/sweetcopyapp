import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv(name: string) {
  const p = resolve(process.cwd(), name);
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1);
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnv(".env");
loadEnv(".env.local");

async function main() {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  // ── 1. Schemas ──────────────────────────────────────────────────────────────
  console.log("\n══ SELECT schema_name FROM information_schema.schemata ══\n");
  const dbNamespaces = await prisma.$queryRaw<{ schema_name: string }[]>`
    SELECT schema_name FROM information_schema.schemata ORDER BY schema_name
  `;
  for (const s of dbNamespaces) console.log(" ", s.schema_name);

  // ── 2. Tables in hlwait ────────────────────────────────────────────────────
  console.log("\n══ Tables in hlwait schema ══\n");
  const tables = await prisma.$queryRaw<{ table_name: string }[]>`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'hlwait' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;
  for (const t of tables) console.log("  hlwait." + t.table_name);
  console.log(`  Total: ${tables.length} tables`);

  // ── 3. Row counts ──────────────────────────────────────────────────────────
  console.log("\n══ Row counts ══\n");
  const counts: Record<string, number> = {};
  for (const t of tables) {
    const res = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*) AS count FROM hlwait.${t.table_name}`
    );
    counts[t.table_name] = Number(res[0].count);
    console.log(`  ${t.table_name.padEnd(25)} ${counts[t.table_name]} rows`);
  }

  // ── 4. SELECT * FROM public.hlwait_users ─────────────────────────────────
  console.log("\n══ SELECT * FROM public.hlwait_users ══\n");
  const users = await prisma.$queryRaw<Record<string, unknown>[]>`
    SELECT id, email, name, role, is_active, created_at
    FROM public.hlwait_users
    ORDER BY created_at
  `;
  console.log(
    "id                                   | email                  | name     | role     | is_active | created_at",
  );
  console.log(
    "-------------------------------------|------------------------|----------|----------|-----------|---------------------",
  );
  for (const r of users) {
    const id     = String(r.id);
    const email  = String(r.email).padEnd(22);
    const name   = String(r.name).padEnd(8);
    const role   = String(r.role).padEnd(8);
    const active = String(r.is_active).padEnd(9);
    const at     = r.created_at instanceof Date
      ? r.created_at.toISOString().slice(0, 19)
      : String(r.created_at).slice(0, 19);
    console.log(`${id} | ${email} | ${name} | ${role} | ${active} | ${at}`);
  }
  console.log(`\nTotal hlwait_users rows: ${users.length}`);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
