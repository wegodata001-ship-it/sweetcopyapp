import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDb } from "@/lib/api-route";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const block = await requireDb();
  if (block) return block;
  const { id } = await ctx.params;
  const row = await prisma.hLWaitTask.findUnique({
    where: { id },
    include: { assignee: { select: { id: true, name: true, email: true } } },
  });
  if (!row) return NextResponse.json({ ok: false, error: "לא נמצא" }, { status: 404 });
  return NextResponse.json({ ok: true, data: row });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const block = await requireDb();
  if (block) return block;
  const { id } = await ctx.params;
  const body = (await req.json()) as {
    title?: string;
    description?: string | null;
    assignedUserId?: string | null;
    dueDate?: string | null;
    status?: string;
  };
  const row = await prisma.hLWaitTask.update({
    where: { id },
    data: {
      ...(body.title?.trim()               ? { title: body.title.trim() }              : {}),
      ...(body.description !== undefined   ? { description: body.description || null } : {}),
      ...(body.assignedUserId !== undefined? { assignedUserId: body.assignedUserId || null } : {}),
      ...(body.dueDate !== undefined       ? { dueDate: body.dueDate ? new Date(body.dueDate) : null } : {}),
      ...(body.status                      ? { status: body.status }                   : {}),
    },
    include: { assignee: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json({ ok: true, data: row });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const block = await requireDb();
  if (block) return block;
  const { id } = await ctx.params;
  await prisma.hLWaitTask.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
