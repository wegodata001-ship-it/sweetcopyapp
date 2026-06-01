import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDb } from "@/lib/api-route";
import { hashPassword } from "@/lib/auth/password";
import { toApiUser } from "@/lib/auth/user-dto";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const block = await requireDb();
  if (block) return block;
  const { id } = await ctx.params;
  const body = (await req.json()) as {
    fullName?: string;
    name?: string;
    email?: string;
    role?: string;
    isActive?: boolean;
    password?: string;
  };
  const data: Record<string, unknown> = {};
  if (body.fullName?.trim() || body.name?.trim()) data.name = (body.fullName ?? body.name)!.trim();
  if (body.email?.trim()) data.email = body.email.trim().toLowerCase();
  if (body.role) data.role = body.role === "admin" ? "admin" : "employee";
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (body.password?.trim()) data.passwordHash = await hashPassword(body.password);
  const row = await prisma.hLWaitUser.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
  return NextResponse.json({ ok: true, data: toApiUser(row) });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const block = await requireDb();
  if (block) return block;
  const { id } = await ctx.params;
  await prisma.hLWaitUser.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
