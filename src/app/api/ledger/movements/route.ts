import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDb } from "@/lib/api-route";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const block = await requireDb();
  if (block) return block;
  const customerId = req.nextUrl.searchParams.get("customerId");
  const supplierId = req.nextUrl.searchParams.get("supplierId");

  if (customerId) {
    const [payments, income] = await Promise.all([
      prisma.hLWaitPayment.findMany({ where: { customerId }, orderBy: { paidAt: "desc" } }),
      prisma.hLWaitIncome.findMany({ where: { customerId }, orderBy: { incomeDate: "desc" } }),
    ]);
    return NextResponse.json({ ok: true, data: { payments, income } });
  }

  if (supplierId) {
    const expenses = await prisma.hLWaitExpense.findMany({
      where: { supplierId },
      orderBy: { expenseDate: "desc" },
    });
    return NextResponse.json({ ok: true, data: { expenses } });
  }

  return NextResponse.json({ ok: true, data: [] });
}
