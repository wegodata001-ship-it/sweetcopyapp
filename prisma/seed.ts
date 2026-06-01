/**
 * DEMO seed — users only.
 * All other tables (products, orders, customers…) start empty.
 * Run: npx prisma db seed
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient();

const USERS = [
  { email: "admin@hlwait.demo",    name: "admin",    role: "admin",    password: "Admin123!" },
  { email: "employee@hlwait.demo", name: "employee", role: "employee", password: "Employee123!" },
] as const;

async function main() {
  for (const u of USERS) {
    const passwordHash = await hashPassword(u.password);
    await prisma.hLWaitUser.upsert({
      where:  { email: u.email },
      create: { email: u.email, name: u.name, role: u.role, passwordHash, isActive: true },
      update: { name: u.name,   role: u.role, passwordHash, isActive: true },
    });
    console.log(`  ✓ ${u.role.padEnd(8)} — ${u.email} / ${u.password}`);
  }

  console.log("\nhlwait seed complete (users only — rest of system starts empty)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
