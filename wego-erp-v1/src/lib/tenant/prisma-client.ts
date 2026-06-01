import { PrismaClient } from "@/generated/hlwait";
import { resolveTenantSchema, type TenantSchemaName } from "./config";

type HlwaitPrisma = PrismaClient;

const clients = new Map<string, HlwaitPrisma>();

/**
 * Build DATABASE_URL with search_path for a tenant schema.
 * Prisma models use @@schema("hlwait") as template; search_path routes queries
 * to the active tenant when using $queryRaw / $executeRaw.
 */
function buildTenantDatabaseUrl(baseUrl: string, schema: TenantSchemaName): string {
  const url = new URL(baseUrl);
  const existing = url.searchParams.get("options") ?? "";
  const searchPath = `-c search_path=${schema},public`;
  url.searchParams.set(
    "options",
    existing ? `${existing} ${searchPath}` : searchPath,
  );
  return url.toString();
}

export type TenantPrismaOptions = {
  schema?: string;
  log?: ("query" | "info" | "warn" | "error")[];
};

/**
 * Prisma client for tenant ERP tables.
 * For typed model access, deploy with schema matching prisma/hlwait.prisma @@schema.
 * For other tenants (desigma, ameer), use fromTenant Supabase client or $queryRaw.
 */
export function getTenantPrisma(options: TenantPrismaOptions = {}): HlwaitPrisma {
  const schema = resolveTenantSchema(options.schema);
  const cached = clients.get(schema);
  if (cached) return cached;

  const baseUrl =
    process.env.DIRECT_URL?.trim() ||
    process.env.DATABASE_URL?.trim();

  if (!baseUrl) {
    throw new Error("DATABASE_URL or DIRECT_URL is required for tenant Prisma");
  }

  const client = new PrismaClient({
    datasources: {
      db: { url: buildTenantDatabaseUrl(baseUrl, schema) },
    },
    log: options.log,
  });

  clients.set(schema, client);
  return client;
}

/** Disconnect all cached tenant Prisma clients (e.g. in tests). */
export async function disconnectAllTenantPrisma(): Promise<void> {
  await Promise.all([...clients.values()].map((c) => c.$disconnect()));
  clients.clear();
}

/** Bootstrap a new tenant schema from application code (requires service DB access). */
export async function bootstrapTenantSchema(schema?: string): Promise<void> {
  const prisma = getTenantPrisma({ schema });
  const name = resolveTenantSchema(schema);
  await prisma.$executeRawUnsafe(`SELECT hlwait.bootstrap_schema('${name}')`);
}
