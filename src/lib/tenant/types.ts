import type { TenantRoleName, TenantTableName } from "./config";

export type TenantRole = {
  id: string;
  name: TenantRoleName;
  label: string;
  permissions: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type TenantUser = {
  id: string;
  auth_user_id: string | null;
  role_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type TenantCategory = {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type TenantSupplier = {
  id: string;
  supplier_code: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  contact_person: string | null;
  tax_id: string | null;
  opening_balance: number;
  balance: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type TenantCustomer = {
  id: string;
  customer_code: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  balance: number;
  created_at: string;
  updated_at: string;
};

export type TenantProduct = {
  id: string;
  category_id: string | null;
  supplier_id: string | null;
  sku: string | null;
  name: string;
  barcode: string | null;
  purchase_price: number;
  sale_price: number;
  current_stock: number;
  min_stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type OrderStatus =
  | "open"
  | "in_preparation"
  | "ready"
  | "delivered"
  | "cancelled";

export type TenantOrder = {
  id: string;
  customer_id: string | null;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  delivered_at: string | null;
  cancelled_at: string | null;
};

export type TenantOrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  notes: string | null;
  created_at: string;
};

export type InventoryMovementType = "in" | "out" | "transfer" | "adjustment";

export type ExpenseType =
  | "supplier"
  | "employee"
  | "daily"
  | "investment"
  | "external";

export type IncomeType = "cash" | "credit" | "bank_transfer" | "other";

export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";

/** Maps table name → row type for typed Supabase queries. */
export type TenantDatabase = {
  roles: TenantRole;
  users: TenantUser;
  categories: TenantCategory;
  suppliers: TenantSupplier;
  supplier_ledger: {
    id: string;
    supplier_id: string;
    entry_date: string;
    doc_type: string;
    description: string;
    debit: number;
    credit: number;
    reference_type: string | null;
    reference_id: string | null;
    created_at: string;
  };
  customers: TenantCustomer;
  products: TenantProduct;
  orders: TenantOrder;
  order_items: TenantOrderItem;
  inventory: {
    id: string;
    product_id: string;
    location: string;
    quantity: number;
    updated_at: string;
  };
  inventory_movements: {
    id: string;
    product_id: string;
    movement_type: InventoryMovementType;
    quantity: number;
    from_location: string | null;
    to_location: string | null;
    reference_type: string | null;
    reference_id: string | null;
    note: string | null;
    created_by: string | null;
    created_at: string;
  };
  payments: {
    id: string;
    customer_id: string | null;
    supplier_id: string | null;
    amount: number;
    payment_method: string;
    reference_type: string | null;
    reference_id: string | null;
    paid_at: string;
    notes: string | null;
    created_at: string;
  };
  expenses: {
    id: string;
    expense_type: ExpenseType;
    supplier_id: string | null;
    employee_id: string | null;
    amount: number;
    description: string;
    expense_date: string;
    payment_status: string;
    created_at: string;
    updated_at: string;
  };
  income: {
    id: string;
    income_type: IncomeType;
    customer_id: string | null;
    order_id: string | null;
    amount: number;
    description: string;
    income_date: string;
    created_at: string;
    updated_at: string;
  };
  tasks: {
    id: string;
    title: string;
    description: string | null;
    assigned_user_id: string | null;
    due_date: string | null;
    status: TaskStatus;
    priority: string;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
  };
  notifications: {
    id: string;
    user_id: string;
    title: string;
    body: string;
    type: string;
    data: Record<string, unknown>;
    read_at: string | null;
    created_at: string;
  };
  documents: {
    id: string;
    title: string;
    file_path: string;
    mime_type: string | null;
    entity_type: string | null;
    entity_id: string | null;
    uploaded_by: string | null;
    created_at: string;
  };
  settings: {
    key: string;
    value: Record<string, unknown>;
    updated_at: string;
  };
};

export type TenantRow<T extends TenantTableName> = TenantDatabase[T];
