import { NextRequest, NextResponse } from "next/server";
import {
  deletePublicFinanceDocument,
  getPublicFinanceDocument,
  patchPublicFinanceDocument,
} from "@/lib/finance/public-documents";
import { requireDb } from "@/lib/api-route";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const block = await requireDb();
  if (block) return block;
  const { id } = await ctx.params;
  const row = await getPublicFinanceDocument(id);
  if (!row) return NextResponse.json({ ok: false, error: "מסמך לא נמצא" }, { status: 404 });
  return NextResponse.json({ ok: true, data: row });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const block = await requireDb();
  if (block) return block;
  const { id } = await ctx.params;
  const body = (await req.json()) as {
    title?: string;
    doc_date?: string | null;
    payload?: unknown;
  };
  const ok = await patchPublicFinanceDocument(id, body);
  if (!ok) return NextResponse.json({ ok: false, error: "מסמך לא נמצא" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const block = await requireDb();
  if (block) return block;
  const { id } = await ctx.params;
  const ok = await deletePublicFinanceDocument(id);
  if (!ok) return NextResponse.json({ ok: false, error: "מסמך לא נמצא" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
