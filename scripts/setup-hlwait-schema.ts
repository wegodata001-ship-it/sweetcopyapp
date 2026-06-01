#!/usr/bin/env npx tsx
/**
 * Bootstrap schema `hlwait` on Supabase (no login, no public ERP push).
 *
 * 1. CREATE SCHEMA + tables via prisma db push (hlwait.prisma)
 * 2. Fallback: run supabase/migrations/20260601120000_hlwait_schema.sql
 * 3. prisma db pull --print → diagnostics
 * 4. List tables in hlwait
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const OUT = join(ROOT, "prisma", "diagnostics");

function run(cmd: string) {
  console.log(`\n> ${cmd}\n`);
  execSync(cmd, { stdio: "inherit", cwd: ROOT, env: process.env });
}

function listHlwaitTables(): string[] {
  const out = execSync(
    `npx prisma db execute --stdin`,
    {
      cwd: ROOT,
      encoding: "utf8",
      input: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'hlwait' AND table_type = 'BASE TABLE' ORDER BY table_name;`,
      env: process.env,
    },
  );
  void out;
  const pulled = execSync("npx prisma db pull --schema=prisma/hlwait.prisma --print", {
    cwd: ROOT,
    encoding: "utf8",
    env: process.env,
  });
  const names: string[] = [];
  for (const line of pulled.split("\n")) {
    const m = line.match(/^model \w+ \{/);
    if (!m) continue;
    const prev = pulled.split("\n")[pulled.split("\n").indexOf(line) - 1];
  }
  const re = /@@map\("([^"]+)"\)/g;
  let mm: RegExpExecArray | null;
  const maps: string[] = [];
  while ((mm = re.exec(pulled)) !== null) maps.push(mm[1]);
  const core = [
    "users",
    "customers",
    "products",
    "orders",
    "order_items",
    "payments",
    "suppliers",
    "inventory",
    "expenses",
    "income",
    "tasks",
  ];
  return [...new Set([...maps, ...core.filter((t) => pulled.includes(`@@map("${t}")`) || pulled.includes(`"${t}"`))])].sort();
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  console.log("=== Setup hlwait schema (no login) ===\n");

  try {
    run("npx prisma db push --schema=prisma/hlwait.prisma --skip-generate");
    run("npx prisma generate");
  } catch (e) {
    console.warn("\n[warn] prisma db push failed — trying SQL migration file...\n", e);
    const sqlPath = join(ROOT, "supabase", "migrations", "20260601120000_hlwait_schema.sql");
    const sql = readFileSync(sqlPath, "utf8");
    const tmp = join(OUT, "hlwait-bootstrap-run.sql");
    writeFileSync(tmp, sql, "utf8");
    run(`npx prisma db execute --file "${tmp}"`);
    run("npx prisma generate");
  }

  console.log("\n--- prisma db pull (print only, saved to diagnostics) ---\n");
  const pulled = execSync("npx prisma db pull --schema=prisma/hlwait.prisma --print", {
    cwd: ROOT,
    encoding: "utf8",
    env: process.env,
  });
  writeFileSync(join(OUT, "hlwait-db-pull.txt"), pulled, "utf8");

  const tables = await listHlwaitTables();
  const report = {
    schema: "hlwait",
    tableCount: tables.length,
    tables,
    expectedCore: [
      "users",
      "customers",
      "products",
      "orders",
      "order_items",
      "payments",
      "suppliers",
      "inventory",
      "expenses",
      "income",
      "tasks",
    ],
    missingCore: [
      "users",
      "customers",
      "products",
      "orders",
      "order_items",
      "payments",
      "suppliers",
      "inventory",
      "expenses",
      "income",
      "tasks",
    ].filter((t) => !tables.includes(t)),
  };
  writeFileSync(join(OUT, "hlwait-tables.json"), JSON.stringify(report, null, 2), "utf8");

  console.log("\n=== Tables in schema hlwait ===\n");
  for (const t of tables) console.log(`  - hlwait.${t}`);
  console.log(`\nTotal: ${tables.length} tables`);
  if (report.missingCore.length) {
    console.warn("\nMissing core tables:", report.missingCore.join(", "));
    process.exit(1);
  }
  console.log("\nAll 11 core tables present. Login was NOT attempted.");
  console.log(`Report: ${join(OUT, "hlwait-tables.json")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
