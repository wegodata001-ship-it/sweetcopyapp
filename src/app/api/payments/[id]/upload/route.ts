/**
 * POST /api/payments/[id]/upload
 *
 * Upload a payment proof/receipt.
 * Stores the file in:  <SUPABASE_STORAGE_BUCKET>/payments/<timestamp>-<name>
 * Saves to DB:          file_url, file_name, bucket_name
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

  const existing = await prisma.hLWaitPayment.findUnique({ where: { id } });
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

  console.log("BUCKET:", process.env.SUPABASE_STORAGE_BUCKET);

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

  const updated = await prisma.hLWaitPayment.update({
    where: { id },
    data: {
      fileUrl: result.file_url,
      fileName: result.file_name,
      bucketName: result.bucket_name,
      storagePath: result.storage_path,
    },
  });

  return NextResponse.json({
    ok: true,
    data: {
      id: updated.id,
      file_url: updated.fileUrl,
      file_name: updated.fileName,
      bucket_name: updated.bucketName,
      storage_path: updated.storagePath,
    },
  });
}
