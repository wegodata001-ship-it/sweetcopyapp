import { prisma } from "@/lib/prisma";
import { looksLikeEmail } from "@/lib/employees/national-id";
import type { ApiUser } from "@/lib/auth/user-dto";
import { toApiUser } from "@/lib/auth/user-dto";

export type LoginUserRow = ApiUser & { passwordHash: string };

/** Resolves a login identifier → public.hlwait_users row */
export async function resolveLoginUser(rawIdentifier: string): Promise<LoginUserRow | null> {
  const trimmed = rawIdentifier.trim();
  if (!trimmed) return null;

  const row = await prisma.hLWaitUser.findFirst({
    where: looksLikeEmail(trimmed)
      ? { email: trimmed.toLowerCase() }
      : {
          OR: [
            { name: { equals: trimmed, mode: "insensitive" } },
            { email: { equals: trimmed, mode: "insensitive" } },
          ],
        },
    select: {
      id: true,
      name: true,
      email: true,
      passwordHash: true,
      role: true,
      isActive: true,
    },
  });

  if (!row) return null;
  return { ...toApiUser(row), passwordHash: row.passwordHash };
}
