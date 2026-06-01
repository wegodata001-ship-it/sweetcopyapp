import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDb } from "@/lib/api-route";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const block = await requireDb();
  if (block) return block;
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const rows = await prisma.hLWaitProduct.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : { isActive: true },
    orderBy: { name: "asc" },
    take: 30,
  });
  return NextResponse.json({ ok: true, data: rows });
}

export async function POST(req: NextRequest) {
  const block = await requireDb();
  if (block) return block;
  const body = (await req.json()) as { name: string; salePrice?: number; supplierId?: string };
  if (!body.name?.trim()) {
    return NextResponse.json({ ok: false, error: "חסר שם מוצר" }, { status: 400 });
  }
  const product = await prisma.hLWaitProduct.create({
    data: {
      name: body.name.trim(),
      salePrice: body.salePrice ?? 0,
      supplierId: body.supplierId || null,
    },
  });
  return NextResponse.json({ ok: true, data: product });
}
