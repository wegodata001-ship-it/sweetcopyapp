/**
 * Read-only: Prisma schema vs PostgreSQL tables (no db push / migrate).
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

const ROOT = process.cwd();
const SCHEMA_PATH = join(ROOT, "prisma", "schema.prisma");
const OUT_DIR = join(ROOT, "prisma", "diagnostics");

function parseExpectedTables(schema: string): { model: string; table: string; schemaName: string }[] {
  const out: { model: string; table: string; schemaName: string }[] = [];
  const blocks = schema.split(/^model /m).slice(1);
  for (const block of blocks) {
    const model = block.match(/^(\w+)/)?.[1];
    if (!model) continue;
    const body = block.slice(block.indexOf("{"));
    const mapM = body.match(/@@map\("([^"]+)"\)/);
    const schemaM = body.match(/@@schema\("([^"]+)"\)/);
    out.push({
      model,
      table: mapM?.[1] ?? model,
      schemaName: schemaM?.[1] ?? "public",
    });
  }
  return out;
}

function extractCreateTables(sql: string): string[] {
  const names: string[] = [];
  const re = /CREATE TABLE (?:IF NOT EXISTS )?"?([^"\s(]+)"?/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql)) !== null) {
    names.push(m[1].replace(/^"|"$/g, ""));
  }
  return [...new Set(names)];
}

async function listDbTables(prisma: PrismaClient): Promise<Map<string, string[]>> {
  const rows = await prisma.$queryRaw<{ table_schema: string; table_name: string }[]>`
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_type = 'BASE TABLE'
      AND table_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY table_schema, table_name
  `;
  const bySchema = new Map<string, string[]>();
  for (const r of rows) {
    const list = bySchema.get(r.table_schema) ?? [];
    list.push(r.table_name);
    bySchema.set(r.table_schema, list);
  }
  return bySchema;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const schemaText = readFileSync(SCHEMA_PATH, "utf8");
  const expectedFromParser = parseExpectedTables(schemaText);

  let diffSql = "";
  try {
    diffSql = execSync(
      "npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script",
      { cwd: ROOT, encoding: "utf8", env: process.env },
    );
    writeFileSync(join(OUT_DIR, "expected-schema.sql"), diffSql, "utf8");
  } catch (e) {
    console.warn("migrate diff failed:", e);
  }

  const tablesFromSql = extractCreateTables(diffSql);
  const prisma = new PrismaClient();
  const dbBySchema = await listDbTables(prisma);

  const publicTables = dbBySchema.get("public") ?? [];
  const publicSet = new Set(publicTables.map((t) => t.toLowerCase()));

  const expectedPublic = expectedFromParser.filter((e) => e.schemaName === "public");
  const missing: { model: string; table: string }[] = [];
  const present: { model: string; table: string }[] = [];

  for (const e of expectedPublic) {
    const found =
      publicSet.has(e.table.toLowerCase()) ||
      publicTables.includes(e.table) ||
      publicTables.includes(e.model);
    if (found) present.push({ model: e.model, table: e.table });
    else missing.push({ model: e.model, table: e.table });
  }

  const focus = ["User", "Payment", "Customer", "Order"] as const;
  const focusStatus = focus.map((name) => {
    const exp = expectedFromParser.find((x) => x.model === name);
    if (!exp) return { model: name, inSchema: false, table: null, inDbPublic: false };
    const inDb =
      publicTables.includes(exp.table) ||
      publicTables.includes(exp.model) ||
      publicSet.has(exp.table.toLowerCase());
    return {
      model: name,
      inSchema: true,
      table: exp.table,
      mapped: exp.table !== name ? `@@map("${exp.table}")` : "(default: model name)",
      schema: exp.schemaName,
      inDbPublic: inDb,
    };
  });

  const report = {
    generatedAt: new Date().toISOString(),
    datasource: {
      provider: "postgresql",
      prismaSchema: "public (default — no @@schema on datasource)",
      databaseUrlSchema: "public (from DATABASE_URL; no ?schema= in typical Supabase URL)",
    },
    focusModels: focusStatus,
    paymentMapping: {
      modelExists: expectedFromParser.some((x) => x.model === "Payment"),
      tableName: "Payment",
      hasMapPayments: /@@map\("payments"\)/i.test(schemaText),
      hasSchemaHlwait: /model Payment[\s\S]*?@@schema\("hlwait"\)/i.test(schemaText),
    },
    counts: {
      prismaModelsInPublic: expectedPublic.length,
      tablesInDbPublic: publicTables.length,
      missingInPublic: missing.length,
      presentInPublic: present.length,
    },
    allSchemasInDb: Object.fromEntries(
      [...dbBySchema.entries()].map(([s, t]) => [s, { count: t.length, tables: t }]),
    ),
    missingTablesPublic: missing,
    extraTablesPublic: publicTables.filter(
      (t) =>
        !expectedPublic.some(
          (e) => e.table === t || e.model === t || e.table.toLowerCase() === t.toLowerCase(),
        ),
    ),
    expectedTablesFromDiffSql: tablesFromSql.sort(),
    expectedTablesFromParser: expectedPublic.map((e) => e.table).sort(),
  };

  writeFileSync(join(OUT_DIR, "report.json"), JSON.stringify(report, null, 2), "utf8");

  console.log("=== PRISMA vs DATABASE (read-only) ===\n");
  console.log(JSON.stringify(report, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
