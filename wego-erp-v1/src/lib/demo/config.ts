/**
 * DEMO-only deployment configuration.
 * This repository (sweetcopyapp) is intended for customer demos only.
 */

export function isDemoAppMode(): boolean {
  const mode = process.env.APP_MODE?.trim().toLowerCase();
  if (mode === "demo") return true;
  if (process.env.DEMO_ONLY === "1" || process.env.DEMO_ONLY === "true") return true;
  return process.env.NEXT_PUBLIC_APP_MODE?.trim().toLowerCase() === "demo";
}

/** Supabase project refs that must never be used when DEMO_ONLY is enabled. */
export function getBlockedProductionRefs(): string[] {
  const raw =
    process.env.DEMO_BLOCKED_SUPABASE_REFS?.trim() ||
    process.env.BLOCKED_PRODUCTION_SUPABASE_REFS?.trim() ||
    "";
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function extractSupabaseRef(url: string): string | null {
  try {
    const host = new URL(url).hostname;
    const m = host.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return m?.[1]?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

function extractPostgresRef(connectionUrl: string): string | null {
  const m = connectionUrl.match(/postgres\.([a-z0-9]+):/i);
  return m?.[1]?.toLowerCase() ?? null;
}

export type DemoSafetyCheck = {
  ok: boolean;
  violations: string[];
};

/** Ensures env points at an allowed DEMO Supabase project (not production). */
export function checkDemoEnvironmentSafety(): DemoSafetyCheck {
  if (!isDemoAppMode()) {
    return { ok: true, violations: [] };
  }

  const violations: string[] = [];
  const blocked = new Set(getBlockedProductionRefs());

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (supabaseUrl) {
    const ref = extractSupabaseRef(supabaseUrl);
    if (ref && blocked.has(ref)) {
      violations.push(
        `NEXT_PUBLIC_SUPABASE_URL references blocked production project "${ref}".`,
      );
    }
  }

  for (const key of ["DATABASE_URL", "DIRECT_URL"] as const) {
    const url = process.env[key]?.trim();
    if (!url) continue;
    const ref = extractPostgresRef(url);
    if (ref && blocked.has(ref)) {
      violations.push(`${key} references blocked production project "${ref}".`);
    }
  }

  const schema =
    process.env.TENANT_DB_SCHEMA?.trim() ||
    process.env.NEXT_PUBLIC_TENANT_DB_SCHEMA?.trim();
  if (schema === "hlwait") {
    violations.push(
      'TENANT_DB_SCHEMA is "hlwait" (production schema name). Use "demo" or "hlwait_demo" for demos.',
    );
  }

  return { ok: violations.length === 0, violations };
}

export function assertDemoEnvironmentSafe(): void {
  const { ok, violations } = checkDemoEnvironmentSafety();
  if (!ok) {
    throw new Error(
      [
        "DEMO_ONLY safety check failed — refusing to connect to production.",
        ...violations.map((v) => `  • ${v}`),
        "Use a separate Supabase DEMO project and .env.demo.local (see README).",
      ].join("\n"),
    );
  }
}
