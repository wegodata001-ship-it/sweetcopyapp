import { prisma } from "@/lib/prisma";
import type {
  DailyPnlPoint,
  DashboardHeroMetrics,
  ExpenseCategoryMetrics,
} from "@/lib/dashboard/financial-engine";
import type { RangeKeyed } from "@/lib/dashboard/time-range";
import { EXPENSE_TYPE_VALUES, type ExpenseType } from "@/lib/finance/expense-types";

export type DashboardAlert = {
  id: string;
  title: string;
  body: string;
  severity?: string;
};

export type WeddingSectionStats = {
  weddings: number;
  orders: number;
  documented: number;
};

export type ZPosSlice = {
  reportsToday: number;
  cashToday: number;
  cardToday: number;
  checksToday: number;
  otherToday: number;
};

export type DashboardHeroSlice = {
  heroMetrics: DashboardHeroMetrics;
  updatedAt: string;
};

export type DashboardSummary = DashboardHeroSlice & {
  dbUnavailable?: boolean;
  expensesByType: ExpenseCategoryMetrics[];
  zPos: ZPosSlice;
  zPosByRange: RangeKeyed<ZPosSlice>;
  weddings: WeddingSectionStats;
  weddingsByRange: RangeKeyed<WeddingSectionStats>;
  dailyChart: DailyPnlPoint[];
  tasksChart: { onTime: number; late: number; early: number };
  supplierPayments: {
    paidCount: number;
    openCount: number;
    lateCount: number;
    pendingCount: number;
    totalPaidAmount: number;
    openDebtAmount: number;
    topSuppliers: { name: string; amount: number }[];
  };
  alerts: DashboardAlert[];
};

const emptyZ: ZPosSlice = {
  reportsToday: 0,
  cashToday: 0,
  cardToday: 0,
  checksToday: 0,
  otherToday: 0,
};

const emptyWedding: WeddingSectionStats = { weddings: 0, orders: 0, documented: 0 };

function rangeKeyed<T>(value: T): RangeKeyed<T> {
  return { today: value, week: value, month: value };
}

function pctChange(current: number, previous: number): number | null {
  if (previous < 1) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

function classifyHlwaitExpense(row: {
  supplierId: string | null;
  employeeId: string | null;
}): ExpenseType {
  if (row.employeeId) return "WORKER_PAYMENTS";
  if (row.supplierId) return "SUPPLIER_PAYMENTS";
  return "DAILY_PAYMENTS";
}

function inDateRange(d: Date, from: Date, to: Date) {
  const t = d.getTime();
  return t >= from.getTime() && t <= to.getTime();
}

function buildExpensesByType(
  rows: {
    amount: { toString(): string };
    expenseDate: Date;
    supplierId: string | null;
    employeeId: string | null;
  }[],
): ExpenseCategoryMetrics[] {
  const today0 = startOfToday();
  const todayEnd = new Date(today0);
  todayEnd.setUTCHours(23, 59, 59, 999);

  const weekStart = new Date(today0);
  weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
  weekEnd.setUTCHours(23, 59, 59, 999);

  const prevWeekEnd = new Date(weekStart);
  prevWeekEnd.setUTCDate(prevWeekEnd.getUTCDate() - 1);
  prevWeekEnd.setUTCHours(23, 59, 59, 999);
  const prevWeekStart = new Date(prevWeekEnd);
  prevWeekStart.setUTCDate(prevWeekStart.getUTCDate() - 6);
  prevWeekStart.setUTCHours(0, 0, 0, 0);

  const monthStart = new Date(Date.UTC(today0.getUTCFullYear(), today0.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(today0.getUTCFullYear(), today0.getUTCMonth() + 1, 0, 23, 59, 59, 999));

  const today = new Map<ExpenseType, number>();
  const week = new Map<ExpenseType, number>();
  const month = new Map<ExpenseType, number>();
  const prevWeek = new Map<ExpenseType, number>();
  const daily = new Map<string, Map<ExpenseType, number>>();

  for (const type of EXPENSE_TYPE_VALUES) {
    today.set(type, 0);
    week.set(type, 0);
    month.set(type, 0);
    prevWeek.set(type, 0);
  }

  for (const row of rows) {
    const type = classifyHlwaitExpense(row);
    const amt = Number(row.amount);
    if (!Number.isFinite(amt) || amt <= 0) continue;
    const ed = new Date(row.expenseDate);
    if (inDateRange(ed, today0, todayEnd)) today.set(type, (today.get(type) ?? 0) + amt);
    if (inDateRange(ed, weekStart, weekEnd)) week.set(type, (week.get(type) ?? 0) + amt);
    if (inDateRange(ed, prevWeekStart, prevWeekEnd)) prevWeek.set(type, (prevWeek.get(type) ?? 0) + amt);
    if (inDateRange(ed, monthStart, monthEnd)) month.set(type, (month.get(type) ?? 0) + amt);
    const sk = ed.toISOString().slice(0, 10);
    if (!daily.has(sk)) daily.set(sk, new Map());
    const bucket = daily.get(sk)!;
    bucket.set(type, (bucket.get(type) ?? 0) + amt);
  }

  const sparkDays: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today0);
    d.setUTCDate(d.getUTCDate() - i);
    sparkDays.push(d.toISOString().slice(0, 10));
  }

  return EXPENSE_TYPE_VALUES.map((type) => {
    const weekAmt = week.get(type) ?? 0;
    const prevWeekAmt = prevWeek.get(type) ?? 0;
    return {
      type,
      today: today.get(type) ?? 0,
      week: weekAmt,
      month: month.get(type) ?? 0,
      prevWeek: prevWeekAmt,
      changePctWeek: pctChange(weekAmt, prevWeekAmt),
      sparkline: sparkDays.map((sk) => daily.get(sk)?.get(type) ?? 0),
    };
  });
}

export async function computeDashboardHeroSlice(_locale: string): Promise<DashboardHeroSlice> {
  const [paymentsToday, incomeToday, expensesToday] = await Promise.all([
    prisma.hLWaitPayment.aggregate({
      _sum: { amount: true },
      where: { paidAt: { gte: startOfToday() } },
    }),
    prisma.hLWaitIncome.aggregate({
      _sum: { amount: true },
      where: { incomeDate: { gte: startOfToday() } },
    }),
    prisma.hLWaitExpense.aggregate({
      _sum: { amount: true },
      where: { expenseDate: { gte: startOfToday() } },
    }),
  ]);

  const todayIncome = Number(paymentsToday._sum.amount ?? 0) + Number(incomeToday._sum.amount ?? 0);
  const todayExpenses = Number(expensesToday._sum.amount ?? 0);

  return {
    heroMetrics: {
      todayIncomeTotal: todayIncome,
      todayIncomeByMethod: { cash: todayIncome, card: 0, check: 0, other: 0 },
      todayCashIncome: todayIncome,
      todayExpenses,
      yesterdayExpenses: 0,
      expenseChangeVsYesterdayPct: null,
      monthIncome: todayIncome,
    },
    updatedAt: new Date().toISOString(),
  };
}

export async function computeDashboardSummary(_locale: string): Promise<DashboardSummary> {
  const hero = await computeDashboardHeroSlice(_locale);
  const [expenseRows, paymentsTotal, ordersOpen, suppliers] = await Promise.all([
    prisma.hLWaitExpense.findMany({
      select: { amount: true, expenseDate: true, supplierId: true, employeeId: true },
      orderBy: { expenseDate: "desc" },
    }),
    prisma.hLWaitPayment.aggregate({ _sum: { amount: true } }),
    prisma.hLWaitOrder.count({ where: { status: "open" } }),
    prisma.hLWaitSupplier.findMany({ take: 5, orderBy: { name: "asc" } }),
  ]);

  return {
    ...hero,
    expensesByType: buildExpensesByType(expenseRows),
    zPos: emptyZ,
    zPosByRange: rangeKeyed(emptyZ),
    weddings: { ...emptyWedding, orders: ordersOpen },
    weddingsByRange: rangeKeyed({ ...emptyWedding, orders: ordersOpen }),
    dailyChart: [],
    tasksChart: { onTime: 0, late: 0, early: 0 },
    supplierPayments: {
      paidCount: 0,
      openCount: suppliers.length,
      lateCount: 0,
      pendingCount: ordersOpen,
      totalPaidAmount: Number(paymentsTotal._sum.amount ?? 0),
      openDebtAmount: 0,
      topSuppliers: suppliers.map((s) => ({ name: s.name, amount: 0 })),
    },
    alerts: [],
  };
}

function startOfToday(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}
