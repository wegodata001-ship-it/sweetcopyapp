import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDb } from "@/lib/api-route";

export const dynamic = "force-dynamic";

export async function GET() {
  const block = await requireDb();
  if (block) return block;

  const [payments, expenses, income, orders] = await Promise.all([
    prisma.hLWaitPayment.aggregate({ _sum: { amount: true }, _count: true }),
    prisma.hLWaitExpense.aggregate({ _sum: { amount: true }, _count: true }),
    prisma.hLWaitIncome.aggregate({ _sum: { amount: true }, _count: true }),
    prisma.hLWaitOrder.count(),
  ]);

  return NextResponse.json({
    ok: true,
    data: {
      paymentsTotal: Number(payments._sum.amount ?? 0),
      paymentsCount: payments._count,
      expensesTotal: Number(expenses._sum.amount ?? 0),
      expensesCount: expenses._count,
      incomeTotal: Number(income._sum.amount ?? 0),
      incomeCount: income._count,
      ordersCount: orders,
    },
  });
}
