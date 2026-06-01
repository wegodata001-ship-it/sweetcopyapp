import { prisma } from "@/lib/prisma";
import type { DashboardHeroMetrics } from "@/lib/dashboard/financial-engine";
import type { RangeKeyed } from "@/lib/dashboard/time-range";

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
  expensesByType: { label: string; amount: number; color?: string }[];
  zPos: ZPosSlice;
  zPosByRange: RangeKeyed<ZPosSlice>;
  weddings: WeddingSectionStats;
  weddingsByRange: RangeKeyed<WeddingSectionStats>;
  dailyChart: { date: string; income: number; expense: number }[];
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
  const [expenses, paymentsTotal, ordersOpen, suppliers] = await Promise.all([
    prisma.hLWaitExpense.findMany({ take: 6, orderBy: { expenseDate: "desc" } }),
    prisma.hLWaitPayment.aggregate({ _sum: { amount: true } }),
    prisma.hLWaitOrder.count({ where: { status: "open" } }),
    prisma.hLWaitSupplier.findMany({ take: 5, orderBy: { name: "asc" } }),
  ]);

  return {
    ...hero,
    expensesByType: expenses.map((e) => ({
      label: e.description || "הוצאה",
      amount: Number(e.amount),
    })),
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
