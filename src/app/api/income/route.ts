import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDb } from "@/lib/api-route";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const block = await requireDb();
  if (block) return block;

  const customerId = req.nextUrl.searchParams.get("customerId");
  const orderId    = req.nextUrl.searchParams.get("orderId");

  try {
    const rows = await prisma.hLWaitIncome.findMany({
      where: {
        ...(customerId ? { customerId } : {}),
        ...(orderId    ? { orderId }    : {}),
      },
      include: {
        customer: { select: { name: true } },
        order:    { select: { orderNumber: true } },
      },
      orderBy: { incomeDate: "desc" },
      take: 200,
    });

    return NextResponse.json({
      ok: true,
      data: rows.map((i) => ({
        id:           i.id,
        amount:       Number(i.amount),
        description:  i.description,
        incomeDate:   i.incomeDate,
        customerId:   i.customerId,
        customerName: i.customer?.name ?? null,
        orderId:      i.orderId,
        orderNumber:  i.order?.orderNumber ?? null,
        createdAt:    i.createdAt,
      })),
    });
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

  try {
    const body = (await req.json()) as {
      amount: number;
      description?: string | null;
      customerId?: string | null;
      orderId?: string | null;
      incomeDate?: string | null;
    };

    if (!(body.amount > 0)) {
      return NextResponse.json({ ok: false, error: "סכום חיובי נדרש" }, { status: 400 });
    }

    const row = await prisma.hLWaitIncome.create({
      data: {
        amount:      body.amount,
        description: body.description?.trim() || "",
        customerId:  body.customerId || null,
        orderId:     body.orderId    || null,
        incomeDate:  body.incomeDate ? new Date(body.incomeDate) : new Date(),
      },
      include: {
        customer: { select: { name: true } },
        order:    { select: { orderNumber: true } },
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
