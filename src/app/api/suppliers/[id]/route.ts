import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDb } from "@/lib/api-route";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const block = await requireDb();
  if (block) return block;
  const { id } = await ctx.params;
  const row = await prisma.hLWaitSupplier.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ ok: false, error: "לא נמצא" }, { status: 404 });
  return NextResponse.json({ ok: true, data: row });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const block = await requireDb();
  if (block) return block;
  const { id } = await ctx.params;
  try {
    const body = (await req.json()) as {
      name?: string;
      phone?: string | null;
      email?: string | null;
      notes?: string | null;
    };
    const row = await prisma.hLWaitSupplier.update({
      where: { id },
      data: {
        ...(body.name  !== undefined ? { name:  body.name?.trim() || undefined } : {}),
        ...(body.phone !== undefined ? { phone: body.phone?.trim() || null }     : {}),
        ...(body.email !== undefined ? { email: body.email?.trim() || null }     : {}),
        ...(body.notes !== undefined ? { notes: body.notes?.trim() || null }     : {}),
      },
    });
    return NextResponse.json({ ok: true, data: row });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "שגיאה" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const block = await requireDb();
  if (block) return block;
  const { id } = await ctx.params;
  try {
    await prisma.hLWaitSupplier.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "שגיאה" },
      { status: 500 },
    );
  }
}
