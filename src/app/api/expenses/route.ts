import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDb } from "@/lib/api-route";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const block = await requireDb();
  if (block) return block;

  const supplierId = req.nextUrl.searchParams.get("supplierId");
  const from = req.nextUrl.searchParams.get("from");
  const to   = req.nextUrl.searchParams.get("to");

  try {
    const rows = await prisma.hLWaitExpense.findMany({
      where: {
        ...(supplierId ? { supplierId } : {}),
        ...(from || to
          ? {
              expenseDate: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to   ? { lte: new Date(to)   } : {}),
              },
            }
          : {}),
      },
      include: {
        supplier: { select: { name: true } },
        employee: { select: { name: true } },
      },
      orderBy: { expenseDate: "desc" },
      take: 200,
    });

    return NextResponse.json({
      ok: true,
      data: rows.map((e) => ({
        id:          e.id,
        amount:      Number(e.amount),
        description: e.description,
        expenseDate: e.expenseDate,
        supplierId:  e.supplierId,
        supplierName: e.supplier?.name ?? null,
        employeeId:  e.employeeId,
        employeeName: e.employee?.name ?? null,
        createdAt:   e.createdAt,
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
      supplierId?: string | null;
      employeeId?: string | null;
      expenseDate?: string | null;
    };

    if (!(body.amount > 0)) {
      return NextResponse.json({ ok: false, error: "סכום חיובי נדרש" }, { status: 400 });
    }

    const row = await prisma.hLWaitExpense.create({
      data: {
        amount:      body.amount,
        description: body.description?.trim() || "",
        supplierId:  body.supplierId || null,
        employeeId:  body.employeeId || null,
        expenseDate: body.expenseDate ? new Date(body.expenseDate) : new Date(),
      },
      include: {
        supplier: { select: { name: true } },
        employee: { select: { name: true } },
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
