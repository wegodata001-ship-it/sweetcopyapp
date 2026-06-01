import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDb } from "@/lib/api-route";
import { orderToFutureOrder, ORDER_CATEGORY_DAILY } from "@/lib/future-orders/helpers";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const block = await requireDb();
  if (block) return block;
  const { id } = await ctx.params;
  const body = (await req.json()) as {
    status?: string;
    totalAmount?: number;
    notes?: string | null;
    customerName?: string;
  };

  const data: Record<string, unknown> = {};
  if (body.status) data.status = body.status;
  if (typeof body.totalAmount === "number") data.total = body.totalAmount;
  if (body.notes !== undefined) data.notes = body.notes?.trim() || null;

  if (body.customerName?.trim()) {
    const existing = await prisma.hLWaitOrder.findUnique({ where: { id }, select: { customerId: true } });
    if (existing?.customerId) {
      await prisma.hLWaitCustomer.update({
        where: { id: existing.customerId },
        data: { name: body.customerName.trim() },
      });
    }
  }

  const row = await prisma.hLWaitOrder.update({
    where: { id },
    data,
    include: { customer: true },
  });
  return NextResponse.json({ ok: true, data: orderToFutureOrder(row, ORDER_CATEGORY_DAILY) });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const block = await requireDb();
  if (block) return block;
  const { id } = await ctx.params;
  await prisma.hLWaitOrder.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
