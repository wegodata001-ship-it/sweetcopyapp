import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDb } from "@/lib/api-route";
import { getSessionFromCookie } from "@/lib/auth/get-session";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const block = await requireDb();
  if (block) return block;
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ ok: false, error: "לא מחובר" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const task = await prisma.hLWaitTask.findFirst({
    where: { id, assignedUserId: session.sub },
  });
  if (!task) {
    return NextResponse.json({ ok: false, error: "משימה לא נמצאה" }, { status: 404 });
  }
  const updated = await prisma.hLWaitTask.update({
    where: { id },
    data: { status: "completed" },
  });
  return NextResponse.json({ ok: true, data: updated });
}
