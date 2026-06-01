import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDb } from "@/lib/api-route";
import { getSessionFromCookie } from "@/lib/auth/get-session";
import { logActivity } from "@/lib/activity-log";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const block = await requireDb();
  if (block) return block;
  const customerId = req.nextUrl.searchParams.get("customerId");
  try {
    const rows = await prisma.hLWaitPayment.findMany({
      where: customerId ? { customerId } : undefined,
      orderBy: { paidAt: "desc" },
      include: { customer: { select: { name: true } } },
      take: 100,
    });
    return NextResponse.json({ ok: true, data: rows });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "שגיאה" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const block = await requireDb();
  if (block) return block;
  const session = await getSessionFromCookie();
  try {
    const body = (await req.json()) as {
      customerId: string;
      amount: number;
      paymentMethod?: string | null;
      notes?: string | null;
    };
    if (!body.customerId || !(body.amount > 0)) {
      return NextResponse.json({ ok: false, error: "לקוח וסכום חיוביים נדרשים" }, { status: 400 });
    }
    const row = await prisma.hLWaitPayment.create({
      data: {
        customerId: body.customerId,
        amount: body.amount,
        paymentMethod: body.paymentMethod?.trim() || "cash",
        notes: body.notes?.trim() || null,
      },
      include: { customer: { select: { name: true } } },
    });
    if (session?.sub) await logActivity(session.sub, "payment_create");
    return NextResponse.json({ ok: true, data: row });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "שגיאה" },
      { status: 500 },
    );
  }
}
