import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDb } from "@/lib/api-route";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const block = await requireDb();
  if (block) return block;
  const { id } = await ctx.params;
  const row = await prisma.hLWaitIncome.findUnique({
    where: { id },
    include: { customer: { select: { name: true } }, order: { select: { orderNumber: true } } },
  });
  if (!row) return NextResponse.json({ ok: false, error: "לא נמצא" }, { status: 404 });
  return NextResponse.json({ ok: true, data: row });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const block = await requireDb();
  if (block) return block;
  const { id } = await ctx.params;
  const body = (await req.json()) as {
    amount?: number;
    description?: string;
    customerId?: string | null;
    incomeDate?: string;
  };
  const row = await prisma.hLWaitIncome.update({
    where: { id },
    data: {
      ...(typeof body.amount === "number" ? { amount: body.amount } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.customerId !== undefined ? { customerId: body.customerId || null } : {}),
      ...(body.incomeDate ? { incomeDate: new Date(body.incomeDate) } : {}),
    },
  });
  return NextResponse.json({ ok: true, data: row });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const block = await requireDb();
  if (block) return block;
  const { id } = await ctx.params;
  await prisma.hLWaitIncome.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
