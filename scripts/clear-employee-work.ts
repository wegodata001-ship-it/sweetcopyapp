/**
 * Clears all demo data except hlwait_users, then reseeds users only.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";

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

  console.log("Clearing all non-user data…");
  await prisma.hLWaitOrderItem.deleteMany();
  await prisma.hLWaitIncome.deleteMany();
  await prisma.hLWaitExpense.deleteMany();
  await prisma.hLWaitPayment.deleteMany();
  await prisma.hLWaitTask.deleteMany();
  await prisma.hLWaitInventory.deleteMany();
  await prisma.hLWaitOrder.deleteMany();
  await prisma.hLWaitProduct.deleteMany();
  await prisma.hLWaitCustomer.deleteMany();
  await prisma.hLWaitSupplier.deleteMany();
  await prisma.hLWaitUser.deleteMany();
  console.log("✓ All data cleared");

  await prisma.$disconnect();

  console.log("\nReseeding users…");
  execSync("npx prisma db seed", { stdio: "inherit", env: process.env });
}

main().catch((e) => { console.error(e); process.exit(1); });
