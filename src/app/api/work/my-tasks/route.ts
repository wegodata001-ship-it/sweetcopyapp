import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDb } from "@/lib/api-route";
import { getSessionFromCookie } from "@/lib/auth/get-session";

export const dynamic = "force-dynamic";

export async function GET() {
  const block = await requireDb();
  if (block) return block;
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ ok: false, error: "לא מחובר" }, { status: 401 });
  }

  const rows = await prisma.hLWaitTask.findMany({
    where: { assignedUserId: session.sub },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const data = rows.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    dueDate: t.dueDate,
    assignedToUserId: t.assignedUserId,
    employeeId: t.assignedUserId,
    orderIndex: 0,
    estimatedMinutes: 15,
    isActive: t.status === "in_progress",
  }));

  return NextResponse.json({ ok: true, data });
}
