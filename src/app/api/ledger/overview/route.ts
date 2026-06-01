import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDb } from "@/lib/api-route";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const block = await requireDb();
  if (block) return block;
  const type = req.nextUrl.searchParams.get("type") ?? "customer";

  if (type === "supplier") {
    const rows = await prisma.hLWaitSupplier.findMany({
      orderBy: { name: "asc" },
      take: 100,
      select: { id: true, name: true, phone: true },
    });
    return NextResponse.json({
      ok: true,
      data: { entities: rows, totalCount: rows.length },
    });
  }

  const rows = await prisma.hLWaitCustomer.findMany({
    orderBy: { name: "asc" },
    take: 100,
    select: { id: true, name: true, phone: true, balance: true },
  });
  return NextResponse.json({
    ok: true,
    data: {
      entities: rows.map((r) => ({
        id: r.id,
        name: r.name,
        phone: r.phone,
        balance: Number(r.balance),
      })),
      totalCount: rows.length,
    },
  });
}
