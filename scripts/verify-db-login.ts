import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv(name: string): void {
  const p = resolve(process.cwd(), name);
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnv(".env"); loadEnv(".env.local");

async function main() {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient({ log: ["query"] });

  console.log("\n=== SELECT * FROM hlwait.users ===\n");
  const users = await prisma.$queryRaw<Record<string, unknown>[]>`SELECT * FROM hlwait.users ORDER BY created_at`;
  console.table(users.map(u => ({ id: String(u.id).slice(0,8)+"...", email: u.email, name: u.name, role: u.role, is_active: u.is_active })));
  console.log(`Rows: ${users.length}`);

  console.log("\n=== SELECT * FROM public.users (if exists) ===\n");
  try {
    const pub = await prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT id, email, "fullName", role FROM public."User" LIMIT 5
    `;
    console.table(pub);
  } catch { console.log("(public.User does not exist — expected)"); }

  console.log("\n=== prisma.user.count() ===");
  const count = await prisma.user.count();
  console.log("count:", count);

  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
