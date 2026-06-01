import { createClient } from "@supabase/supabase-js";

function supabaseProjectUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "") ?? "";
}

/** Server-only client with service role — Storage uploads and admin operations. */
export function getSupabaseServiceClient() {
  const url = supabaseProjectUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getPublicStorageUrl(bucket: string, path: string): string {
  const base = supabaseProjectUrl();
  if (!base) return "";
  const safePath = encodeURIComponent(path).replace(/%2F/g, "/");
  return `${base}/storage/v1/object/public/${bucket}/${safePath}`;
}
