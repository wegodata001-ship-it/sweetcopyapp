import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  resolveTenantSchema,
  type TenantSchemaName,
  type TenantTableName,
} from "./config";
import type { TenantDatabase } from "./types";

export type TenantSupabaseClient = SupabaseClient & {
  tenantSchema: TenantSchemaName;
  /** Query builder for a table in the active tenant schema */
  fromTenant: (table: TenantTableName) => ReturnType<
    ReturnType<SupabaseClient["schema"]>["from"]
  >;
};

type ClientOptions = {
  schema?: string;
  serviceRole?: boolean;
};

function readSupabaseUrl(): string | null {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || null;
}

function readSupabaseKey(serviceRole: boolean): string | null {
  if (serviceRole) {
    return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null;
  }
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    null
  );
}

export function isTenantSupabaseConfigured(): boolean {
  return Boolean(readSupabaseUrl() && readSupabaseKey(false));
}

/**
 * Schema-aware Supabase client.
 * All queries go through `.fromTenant('customers')` — never `.from()` on public.
 */
export function createTenantSupabaseClient(
  options: ClientOptions = {},
): TenantSupabaseClient | null {
  const url = readSupabaseUrl();
  const serviceRole = options.serviceRole ?? false;
  const key = readSupabaseKey(serviceRole);

  if (!url || !key) return null;

  const tenantSchema = resolveTenantSchema(options.schema);

  const base = createClient(url, key, {
    auth: { persistSession: !serviceRole, autoRefreshToken: !serviceRole },
    db: { schema: tenantSchema },
  });

  const client = base as TenantSupabaseClient;
  client.tenantSchema = tenantSchema;

  client.fromTenant = <T extends TenantTableName>(table: T) => {
    return base.schema(tenantSchema).from(table);
  };

  return client;
}

let browserTenantClient: TenantSupabaseClient | null = null;

/** Browser singleton — uses public schema. */
export function getTenantSupabaseBrowserClient(): TenantSupabaseClient | null {
  if (typeof window === "undefined") return null;
  if (!isTenantSupabaseConfigured()) return null;
  if (!browserTenantClient) {
    browserTenantClient = createTenantSupabaseClient();
  }
  return browserTenantClient;
}

/** Server — service role, bypasses RLS. */
export function getTenantSupabaseServiceClient(
  schema?: string,
): TenantSupabaseClient | null {
  return createTenantSupabaseClient({ schema, serviceRole: true });
}

/** Server — user-scoped (respects RLS when JWT attached). */
export function getTenantSupabaseServerClient(
  schema?: string,
): TenantSupabaseClient | null {
  return createTenantSupabaseClient({ schema, serviceRole: false });
}
