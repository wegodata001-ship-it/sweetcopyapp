import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDb } from "@/lib/api-route";
import { toApiUser } from "@/lib/auth/user-dto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const block = await requireDb();
  if (block) return block;
  const forTasks = req.nextUrl.searchParams.get("forTasks") === "1";
  const rows = await prisma.hLWaitUser.findMany({
    where: forTasks ? { role: "employee", isActive: true } : undefined,
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
  return NextResponse.json({
    ok: true,
    data: rows.map((r) => ({
      id: r.id,
      name: r.name,
      fullName: r.name,
      email: r.email,
      role: r.role,
      user: toApiUser(r),
    })),
  });
}

export async function POST() {
  return NextResponse.json(
    { ok: false, error: "יצירת עובד — השתמשו ב-/api/admin/users" },
    { status: 400 },
  );
}
