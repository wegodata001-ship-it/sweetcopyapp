import { NextRequest, NextResponse } from "next/server";
import { requireDb } from "@/lib/api-route";
import {
  createPublicFinanceDocument,
  listPublicFinanceDocuments,
} from "@/lib/finance/public-documents";

export const dynamic = "force-dynamic";

export async function GET() {
  const block = await requireDb();
  if (block) return block;
  const rows = await listPublicFinanceDocuments();
  const sent = rows.filter((r) => r.sent_to_cpa).length;
  return NextResponse.json({
    ok: true,
    data: rows,
    counts: { total: rows.length, sent, notSent: rows.length - sent },
  });
}

export async function POST(req: NextRequest) {
  const block = await requireDb();
  if (block) return block;
  try {
    const body = (await req.json()) as {
      title?: string;
      category?: string;
      docDate?: string | null;
      payload?: unknown;
    };
    const title = body.title?.trim() || body.category?.trim() || "מסמך";
    const created = await createPublicFinanceDocument({
      title,
      category: body.category?.trim() || "",
      docDate: body.docDate || null,
      payload: body.payload,
    });
    return NextResponse.json({ ok: true, id: created.id });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "שמירת מסמך נכשלה" },
      { status: 400 },
    );
  }
}
