import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

/** Creates first admin from SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD if no users exist */
export async function ensureBootstrapSuperAdmin(): Promise<void> {
  const count = await prisma.hLWaitUser.count();
  if (count > 0) return;

  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;
  if (!email || !password) return;

  const passwordHash = await hashPassword(password);
  await prisma.hLWaitUser.create({
    data: {
      name: "admin",
      email,
      passwordHash,
      role: "admin",
      isActive: true,
    },
  });
}
