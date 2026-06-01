import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth/get-session";
import { prisma } from "@/lib/prisma";
import { requireDb } from "@/lib/api-route";

export const dynamic = "force-dynamic";

export async function GET() {
  const dbErr = await requireDb();
  if (dbErr) return dbErr;

  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ ok: false, error: "נדרשת התחברות" }, { status: 401 });
  }

  const uid = session.sub;

  try {
    const [openTasks, ordersOpen, products] = await Promise.all([
      prisma.hLWaitTask.count({
        where: {
          assignedUserId: uid,
          status: { in: ["pending", "open", "in_progress"] },
        },
      }),
      prisma.hLWaitOrder.count({ where: { status: "open" } }),
      prisma.hLWaitProduct.findMany({
        where: { isActive: true },
        select: { currentStock: true, minStock: true },
      }),
    ]);
    const productsLow = products.filter((p) => p.currentStock <= p.minStock).length;

    return NextResponse.json({
      ok: true,
      data: {
        session: null,
        today: { sessions: [], completed_minutes: 0 },
        active_run: null,
        other_active_run_count: 0,
        counts: {
          open_tasks: openTasks,
          late_tasks: 0,
          active_runs: 0,
          daily_work_tasks: openTasks,
          orders_open: ordersOpen,
          products_low: productsLow,
        },
      },
    });
  } catch (e) {
    console.error("[GET /api/me/dashboard]", e);
    return NextResponse.json(
      { ok: false, error: "שגיאה בטעינת לוח הבית" },
      { status: 500 },
    );
  }
}
