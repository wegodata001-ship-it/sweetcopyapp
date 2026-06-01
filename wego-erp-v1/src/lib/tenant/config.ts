/**
 * Central tenant / schema configuration.
 * Never hardcode schema names in application code — read from here.
 *
 * Env priority (demo app defaults to schema "demo"):
 *   TENANT_DB_SCHEMA → NEXT_PUBLIC_TENANT_DB_SCHEMA → APP_MODE=demo ? "demo" : "hlwait"
 */

const SCHEMA_PATTERN = /^[a-z][a-z0-9_]*$/;

function isDemoAppMode(): boolean {
  const mode = process.env.APP_MODE?.trim().toLowerCase();
  if (mode === "demo") return true;
  if (process.env.DEMO_ONLY === "1" || process.env.DEMO_ONLY === "true") return true;
  return process.env.NEXT_PUBLIC_APP_MODE?.trim().toLowerCase() === "demo";
}

export type TenantSchemaName = string;

export type TenantRoleName =
  | "super_admin"
  | "admin"
  | "manager"
  | "employee"
  | "viewer";

export const TENANT_TABLES = {
  roles: "roles",
  users: "users",
  categories: "categories",
  suppliers: "suppliers",
  supplierLedger: "supplier_ledger",
  customers: "customers",
  products: "products",
  orders: "orders",
  orderItems: "order_items",
  inventory: "inventory",
  inventoryMovements: "inventory_movements",
  payments: "payments",
  expenses: "expenses",
  income: "income",
  tasks: "tasks",
  notifications: "notifications",
  documents: "documents",
  settings: "settings",
} as const;

export type TenantTableName = (typeof TENANT_TABLES)[keyof typeof TENANT_TABLES];

/** Demo schema names: demo, hlwait_demo, demo_*, *_demo */
export function isDemoSchema(schema: string): boolean {
  return (
    schema === "demo" ||
    schema.endsWith("_demo") ||
    schema.startsWith("demo_")
  );
}

export function resolveTenantSchema(override?: string): TenantSchemaName {
  const raw =
    override?.trim() ||
    process.env.TENANT_DB_SCHEMA?.trim() ||
    process.env.NEXT_PUBLIC_TENANT_DB_SCHEMA?.trim() ||
    (isDemoAppMode() ? "demo" : "hlwait");

  if (!SCHEMA_PATTERN.test(raw)) {
    throw new Error(
      `Invalid tenant schema "${raw}". Must match ${SCHEMA_PATTERN.source}`,
    );
  }
  return raw;
}

/** Qualified PostgreSQL identifier: "schema"."table" */
export function qualifiedTable(schema: string, table: TenantTableName): string {
  return `"${schema}"."${table}"`;
}

/** Bootstrap a new tenant schema via SQL (server-side only). */
export function bootstrapSchemaSql(schema: string): string {
  const safe = resolveTenantSchema(schema);
  return `SELECT hlwait.bootstrap_schema('${safe}')`;
}
