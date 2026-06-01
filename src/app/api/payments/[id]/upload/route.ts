/**
 * POST /api/payments/[id]/upload — שומר קבלה ב-notes של תשלום (מודל Payment).
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDb } from "@/lib/api-route";
import { uploadDocument } from "@/lib/storage/document-upload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 20 * 1024 * 1024;

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const block = await requireDb();
  if (block) return block;

  const { id } = await ctx.params;

  const existing = await prisma.payment.findUnique({ where: { id }, select: { id: true, notes: true } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "תשלום לא נמצא" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "שדה 'file' נדרש (multipart/form-data)" },
      { status: 400 },
    );
  }
  if (file.size === 0) {
    return NextResponse.json({ ok: false, error: "הקובץ ריק" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: `הקובץ גדול מדי (מקסימום ${MAX_BYTES / 1024 / 1024} MB)` },
      { status: 413 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await uploadDocument({
    buffer,
    fileName: file.name || "payment-receipt",
    contentType: file.type || "application/octet-stream",
    category: "payments",
  });

  if (!result) {
    return NextResponse.json(
      { ok: false, error: "העלאת הקובץ נכשלה — ודא שה-Storage מוגדר" },
      { status: 502 },
    );
  }

  let attachmentMeta: Record<string, string> = {};
  try {
    if (existing.notes?.trim().startsWith("{")) {
      attachmentMeta = JSON.parse(existing.notes) as Record<string, string>;
    }
  } catch {
    attachmentMeta = { text: existing.notes ?? "" };
  }

  const updated = await prisma.payment.update({
    where: { id },
    data: {
      notes: JSON.stringify({
        ...attachmentMeta,
        receiptFileUrl: result.file_url,
        receiptFileName: result.file_name,
        receiptBucket: result.bucket_name,
        receiptStoragePath: result.storage_path,
      }),
    },
  });

  return NextResponse.json({
    ok: true,
    data: {
      id: updated.id,
      file_url: result.file_url,
      file_name: result.file_name,
      bucket_name: result.bucket_name,
      storage_path: result.storage_path,
    },
  });
}
