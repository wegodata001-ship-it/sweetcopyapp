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

  const rows = await prisma.$queryRaw<{ table_schema: string; table_name: string }[]>`
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_type = 'BASE TABLE'
      AND table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
    ORDER BY table_schema, table_name
  `;

  console.log("\nSELECT table_schema, table_name");
  console.log("FROM information_schema.tables");
  console.log("ORDER BY table_schema, table_name;\n");
  console.log("table_schema   | table_name");
  console.log("---------------|-----------------------------");
  for (const r of rows) {
    console.log(`${r.table_schema.padEnd(15)}| ${r.table_name}`);
  }
  console.log(`\nTotal: ${rows.length} rows`);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
