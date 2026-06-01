import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDb } from "@/lib/api-route";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const block = await requireDb();
  if (block) return block;
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const rows = await prisma.hLWaitSupplier.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ ok: true, data: rows });
}

export async function POST(req: NextRequest) {
  const block = await requireDb();
  if (block) return block;
  const body = (await req.json()) as { name: string; phone?: string | null };
  if (!body.name?.trim()) {
    return NextResponse.json({ ok: false, error: "חסר שם" }, { status: 400 });
  }
  const row = await prisma.hLWaitSupplier.create({
    data: { name: body.name.trim(), phone: body.phone?.trim() || null },
  });
  return NextResponse.json({ ok: true, data: row });
}
