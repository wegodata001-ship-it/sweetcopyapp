import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDb } from "@/lib/api-route";
import { toApiUser } from "@/lib/auth/user-dto";
import { hlwaitApiDisabled } from "@/lib/api/hlwait-not-implemented";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const block = await requireDb();
  if (block) return block;
  const { id } = await ctx.params;
  const row = await prisma.hLWaitUser.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
  if (!row) return NextResponse.json({ ok: false, error: "לא נמצא" }, { status: 404 });
  return NextResponse.json({ ok: true, data: toApiUser(row) });
}

export async function PATCH() {
  return hlwaitApiDisabled();
}

export async function DELETE() {
  return hlwaitApiDisabled();
}
