import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type TenantPrismaOptions = { schema?: string };

/** hlwait-only: single Prisma client (schema fixed in prisma/schema.prisma) */
export function getTenantPrisma(_options: TenantPrismaOptions = {}): PrismaClient {
  return prisma;
}

export async function bootstrapTenantSchema(_schema?: string): Promise<void> {
  return;
}
