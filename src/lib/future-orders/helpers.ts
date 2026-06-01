import type { HLWaitOrder, HLWaitCustomer } from "@prisma/client";
import type { SessionJwtPayload } from "@/lib/auth/jwt";
import { isAdminRole } from "@/lib/auth/session-role";

// ── Categories ─────────────────────────────────────────────────────────────────

export const ORDER_CATEGORY_DAILY   = "DAILY_ORDER";
export const ORDER_CATEGORY_WEDDING = "WEDDING_ORDER";

export type OrderCategory = typeof ORDER_CATEGORY_DAILY | typeof ORDER_CATEGORY_WEDDING;
export type OrdersModule  = "daily" | "wedding";

export function isValidOrderCategory(c: string): c is OrderCategory {
  return c === ORDER_CATEGORY_DAILY || c === ORDER_CATEGORY_WEDDING;
}

export function moduleToCategory(module: OrdersModule): OrderCategory {
  return module === "wedding" ? ORDER_CATEGORY_WEDDING : ORDER_CATEGORY_DAILY;
}

// ── Statuses ───────────────────────────────────────────────────────────────────

export type FutureOrderStatus =
  | "open"
  | "pending"
  | "in_preparation"
  | "ready"
  | "completed"
  | "cancelled";

export const FUTURE_ORDER_STATUSES: FutureOrderStatus[] = [
  "open",
  "pending",
  "in_preparation",
  "ready",
  "completed",
  "cancelled",
];

export function isValidStatus(s: string): boolean {
  return FUTURE_ORDER_STATUSES.includes(s as FutureOrderStatus);
}

export function statusI18nKey(status: string): string {
  const MAP: Record<string, string> = {
    open:           "orders.status.open",
    pending:        "orders.status.pending",
    in_preparation: "orders.status.inPreparation",
    ready:          "orders.status.ready",
    completed:      "orders.status.completed",
    cancelled:      "orders.status.cancelled",
  };
  return MAP[status] ?? "orders.status.open";
}

export function weddingStatusI18nKey(status: string): string {
  return statusI18nKey(status);
}

export const STATUS_BADGE_CLASS: Record<string, string> = {
  open:           "bg-blue-100 text-blue-800",
  pending:        "bg-yellow-100 text-yellow-800",
  in_preparation: "bg-orange-100 text-orange-800",
  ready:          "bg-green-100 text-green-700",
  completed:      "bg-gray-100 text-gray-600",
  cancelled:      "bg-red-100 text-red-700",
};

export const WEDDING_STATUS_BADGE_CLASS: Record<string, string> = STATUS_BADGE_CLASS;

// ── Visual ─────────────────────────────────────────────────────────────────────

export const DAILY_GRADIENT   = "from-blue-50 to-indigo-50";
export const WEDDING_GRADIENT = "from-pink-50 to-rose-50";

// ── Helpers ────────────────────────────────────────────────────────────────────

export function computeRemainingAmount(total: number, deposit: number): number {
  return Math.max(0, total - deposit);
}

export function isWeddingOrderOverdue(order: { status: string; eventDate?: Date | null }): boolean {
  if (order.status === "completed" || order.status === "cancelled") return false;
  if (!order.eventDate) return false;
  return new Date(order.eventDate) < new Date();
}

export function eventTypeForCategory(_category: OrderCategory): string {
  return "OTHER";
}

export function prismaCategoryFilter(_category: OrderCategory): Record<string, never> {
  return {};
}

export async function backfillOrderCategoriesOnce(): Promise<void> {
  return;
}

// ── Access ─────────────────────────────────────────────────────────────────────

export function canViewWeddingOrders(session: SessionJwtPayload): boolean {
  return isAdminRole(session.role);
}

export function canManageOrderCategory(session: SessionJwtPayload, _category: string): boolean {
  return isAdminRole(session.role) || session.permissions.includes("employee_clock");
}

// ── DTO ────────────────────────────────────────────────────────────────────────

export type FutureOrderDto = {
  id: string;
  orderNumber: number;
  customerName: string;
  phone: string | null;
  eventType: string;
  eventDate: Date;
  eventTime: string | null;
  itemsDescription: string | null;
  totalAmount: number;
  depositAmount: number;
  remainingAmount: number;
  depositPaid: boolean;
  status: string;
  isCompleted: boolean;
  completedAt: Date | null;
  notes: string | null;
  orderCategory: OrderCategory;
  address: string | null;
  guestCount: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export function orderToFutureOrder(
  o: HLWaitOrder & { customer?: HLWaitCustomer | null },
  category: OrderCategory = ORDER_CATEGORY_DAILY,
): FutureOrderDto {
  const num   = parseInt(o.orderNumber.replace(/\D/g, ""), 10) || 0;
  const total = Number(o.total);
  return {
    id:               o.id,
    orderNumber:      num,
    customerName:     o.customer?.name ?? "—",
    phone:            o.customer?.phone ?? null,
    eventType:        "OTHER",
    eventDate:        o.createdAt,
    eventTime:        null,
    itemsDescription: o.notes,
    totalAmount:      total,
    depositAmount:    0,
    remainingAmount:  total,
    depositPaid:      false,
    status:           o.status,
    isCompleted:      o.status === "completed",
    completedAt:      o.status === "completed" ? o.updatedAt : null,
    notes:            o.notes,
    orderCategory:    category,
    address:          o.customer?.address ?? null,
    guestCount:       null,
    createdAt:        o.createdAt,
    updatedAt:        o.updatedAt,
  };
}
