/**
 * Central document upload helper for hlwait.
 *
 * Bucket:  always process.env.SUPABASE_STORAGE_BUCKET  (e.g. "hlwait-documents")
 * Folders inside the bucket:
 *   invoices/   – customer invoices / income documents
 *   receipts/   – scanned supplier receipts
 *   payments/   – payment proof attachments
 *   expenses/   – expense receipt attachments
 */
import { getPublicStorageUrl, getSupabaseServiceClient } from "@/lib/supabase/server";

export type DocCategory = "invoices" | "receipts" | "payments" | "expenses";

export type UploadDocumentResult = {
  file_url: string;
  file_name: string;
  bucket_name: string;
  storage_path: string;
};

/** Resolve the storage bucket from ENV — never hard-coded. */
function documentBucket(): string {
  const b = process.env.SUPABASE_STORAGE_BUCKET?.trim();
  console.log("BUCKET:", process.env.SUPABASE_STORAGE_BUCKET);
  if (!b) {
    throw new Error(
      "חסר SUPABASE_STORAGE_BUCKET ב-.env — הגדר את שם הבאקט ב-Supabase Storage",
    );
  }
  return b;
}

function safeFileName(name: string): string {
  const cleaned = name.replace(/[\\/]+/g, "-").replace(/[^A-Za-z0-9._\-]+/g, "_");
  if (cleaned.length <= 120) return cleaned;
  const dot = cleaned.lastIndexOf(".");
  if (dot > 0 && dot >= cleaned.length - 10) {
    const ext = cleaned.slice(dot);
    return cleaned.slice(0, 120 - ext.length) + ext;
  }
  return cleaned.slice(0, 120);
}

/**
 * Upload a document buffer to Supabase Storage.
 *
 * Path layout:  <category>/<timestamp>-<safeName>
 *
 * Returns null when Supabase is not configured or upload fails,
 * so callers can degrade gracefully without throwing.
 */
export async function uploadDocument(input: {
  buffer: Buffer;
  fileName: string;
  contentType: string;
  category: DocCategory;
}): Promise<UploadDocumentResult | null> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    console.warn("[uploadDocument] Supabase not configured — skipping upload");
    return null;
  }

  let bucket: string;
  try {
    bucket = documentBucket();
  } catch (e) {
    console.error("[uploadDocument] bucket error:", e instanceof Error ? e.message : e);
    return null;
  }

  const safe = safeFileName(input.fileName);
  const storagePath = `${input.category}/${Date.now()}-${safe}`;

  console.log("[uploadDocument] uploading", {
    bucket,
    path: storagePath,
    size: input.buffer.length,
    contentType: input.contentType,
  });

  try {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, input.buffer, {
        contentType: input.contentType,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("[uploadDocument] supabase error:", error.message);
      return null;
    }

    const file_url = getPublicStorageUrl(bucket, storagePath);
    if (!file_url) {
      console.error("[uploadDocument] could not build public URL");
      return null;
    }

    console.log("[uploadDocument] upload ok", { bucket, path: storagePath, file_url });

    return {
      file_url,
      file_name: input.fileName,
      bucket_name: bucket,
      storage_path: storagePath,
    };
  } catch (e) {
    console.error("[uploadDocument] failed:", e instanceof Error ? e.message : e);
    return null;
  }
}

/**
 * Delete a previously uploaded document from Storage.
 * Best-effort — failures are logged but not re-thrown.
 */
export async function deleteDocument(storagePath: string, bucket?: string): Promise<void> {
  if (!storagePath) return;
  const supabase = getSupabaseServiceClient();
  if (!supabase) return;

  let resolvedBucket: string;
  try {
    resolvedBucket = bucket?.trim() || documentBucket();
  } catch {
    return;
  }

  try {
    await supabase.storage.from(resolvedBucket).remove([storagePath]);
    console.log("[deleteDocument] deleted", { bucket: resolvedBucket, path: storagePath });
  } catch (e) {
    console.error("[deleteDocument] failed:", e instanceof Error ? e.message : e);
  }
}
