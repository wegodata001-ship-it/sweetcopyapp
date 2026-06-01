import { uploadDocument } from "@/lib/storage/document-upload";

/**
 * Upload a scanned receipt to Supabase Storage and return a public URL.
 *
 * Files are stored under:
 *   <SUPABASE_STORAGE_BUCKET>/receipts/<timestamp>-<safeName>
 *
 * Returns null when Supabase isn't configured so the scan flow degrades
 * gracefully (the parsed JSON is still returned).
 */
export async function uploadReceiptToStorage(
  buffer: Buffer,
  fileName: string,
  contentType: string,
): Promise<{ url: string; path: string; file_url: string; file_name: string; bucket_name: string } | null> {
  const result = await uploadDocument({
    buffer,
    fileName,
    contentType,
    category: "receipts",
  });
  if (!result) return null;
  return {
    url: result.file_url,
    path: result.storage_path,
    file_url: result.file_url,
    file_name: result.file_name,
    bucket_name: result.bucket_name,
  };
}
