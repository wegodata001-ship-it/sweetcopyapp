import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDb } from "@/lib/api-route";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const block = await requireDb();
  if (block) return block;
  const type = req.nextUrl.searchParams.get("type") ?? "customer";

  if (type === "supplier") {
    const rows = await prisma.hLWaitSupplier.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({ ok: true, data: rows });
  }

  const rows = await prisma.hLWaitCustomer.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ ok: true, data: rows });
}
