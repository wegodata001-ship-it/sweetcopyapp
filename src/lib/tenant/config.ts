/**
 * Legacy tenant table-name helpers.
 * Runtime uses a single Supabase project and the public schema only.
 */

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
  return override?.trim() || "public";
}

/** Qualified PostgreSQL identifier: "schema"."table" */
export function qualifiedTable(schema: string, table: TenantTableName): string {
  return `"${schema}"."${table}"`;
}

/** Bootstrap a new tenant schema via SQL (server-side only). */
export function bootstrapSchemaSql(schema: string): string {
  const safe = resolveTenantSchema(schema);
  return `SELECT '${safe}'`;
}
