export {
  TENANT_TABLES,
  bootstrapSchemaSql,
  isDemoSchema,
  qualifiedTable,
  resolveTenantSchema,
  type TenantRoleName,
  type TenantSchemaName,
  type TenantTableName,
} from "./config";

export { isDemoAppMode } from "@/lib/demo";

export type {
  ExpenseType,
  IncomeType,
  InventoryMovementType,
  OrderStatus,
  TaskStatus,
  TenantCategory,
  TenantCustomer,
  TenantDatabase,
  TenantOrder,
  TenantOrderItem,
  TenantProduct,
  TenantRole,
  TenantRow,
  TenantSupplier,
  TenantUser,
} from "./types";

export {
  createTenantSupabaseClient,
  getTenantSupabaseBrowserClient,
  getTenantSupabaseServerClient,
  getTenantSupabaseServiceClient,
  isTenantSupabaseConfigured,
  type TenantSupabaseClient,
} from "./supabase-client";

export {
  bootstrapTenantSchema,
  disconnectAllTenantPrisma,
  getTenantPrisma,
} from "./prisma-client";
