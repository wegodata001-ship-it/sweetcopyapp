import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDb } from "@/lib/api-route";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const block = await requireDb();
  if (block) return block;
  const { id } = await ctx.params;
  const row = await prisma.hLWaitProduct.findUnique({
    where: { id },
    include: { inventory: true, supplier: { select: { id: true, name: true } } },
  });
  if (!row) return NextResponse.json({ ok: false, error: "לא נמצא" }, { status: 404 });
  return NextResponse.json({ ok: true, data: row });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const block = await requireDb();
  if (block) return block;
  const { id } = await ctx.params;
  const body = (await req.json()) as {
    name?: string;
    sku?: string | null;
    currentStock?: number;
    minStock?: number;
    salePrice?: number;
    supplierId?: string | null;
    isActive?: boolean;
  };
  const row = await prisma.hLWaitProduct.update({
    where: { id },
    data: {
      ...(body.name?.trim()                     ? { name: body.name.trim() }            : {}),
      ...(body.sku !== undefined                 ? { sku: body.sku?.trim() || null }     : {}),
      ...(typeof body.currentStock === "number"  ? { currentStock: body.currentStock }   : {}),
      ...(typeof body.minStock === "number"      ? { minStock: body.minStock }           : {}),
      ...(typeof body.salePrice === "number"     ? { salePrice: body.salePrice }         : {}),
      ...(body.supplierId !== undefined          ? { supplierId: body.supplierId || null } : {}),
      ...(typeof body.isActive === "boolean"     ? { isActive: body.isActive }           : {}),
    },
  });
  return NextResponse.json({ ok: true, data: row });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const block = await requireDb();
  if (block) return block;
  const { id } = await ctx.params;
  try {
    await prisma.hLWaitProduct.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "שגיאה" },
      { status: 500 },
    );
  }
}
