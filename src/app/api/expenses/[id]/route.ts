import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDb } from "@/lib/api-route";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const block = await requireDb();
  if (block) return block;
  const { id } = await ctx.params;
  const row = await prisma.hLWaitExpense.findUnique({
    where: { id },
    include: { supplier: { select: { name: true } }, employee: { select: { name: true } } },
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
    supplierId?: string | null;
    expenseDate?: string;
  };
  const row = await prisma.hLWaitExpense.update({
    where: { id },
    data: {
      ...(typeof body.amount === "number" ? { amount: body.amount } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.supplierId !== undefined ? { supplierId: body.supplierId || null } : {}),
      ...(body.expenseDate ? { expenseDate: new Date(body.expenseDate) } : {}),
    },
  });
  return NextResponse.json({ ok: true, data: row });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const block = await requireDb();
  if (block) return block;
  const { id } = await ctx.params;
  await prisma.hLWaitExpense.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
