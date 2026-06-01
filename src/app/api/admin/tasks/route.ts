import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDb } from "@/lib/api-route";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const block = await requireDb();
  if (block) return block;

  const assignedUserId = req.nextUrl.searchParams.get("assignedUserId");
  const status         = req.nextUrl.searchParams.get("status");

  const rows = await prisma.hLWaitTask.findMany({
    where: {
      ...(assignedUserId ? { assignedUserId } : {}),
      ...(status ? { status } : {}),
    },
    include: { assignee: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ ok: true, data: rows });
}

export async function POST(req: NextRequest) {
  const block = await requireDb();
  if (block) return block;

  const body = (await req.json()) as {
    title: string;
    description?: string | null;
    assignedUserId?: string | null;
    dueDate?: string | null;
    status?: string;
  };

  if (!body.title?.trim()) {
    return NextResponse.json({ ok: false, error: "כותרת חובה" }, { status: 400 });
  }

  const row = await prisma.hLWaitTask.create({
    data: {
      title:          body.title.trim(),
      description:    body.description?.trim() || null,
      assignedUserId: body.assignedUserId || null,
      dueDate:        body.dueDate ? new Date(body.dueDate) : null,
      status:         body.status || "pending",
    },
    include: { assignee: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({ ok: true, data: row });
}
