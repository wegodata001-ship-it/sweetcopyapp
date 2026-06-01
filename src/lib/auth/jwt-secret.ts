import { randomBytes } from "node:crypto";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ENV_LOCAL = resolve(process.cwd(), ".env.local");

let cachedSecret: string | null = null;

function readJwtSecretFromEnvLocal(): string | null {
  if (!existsSync(ENV_LOCAL)) return null;
  const text = readFileSync(ENV_LOCAL, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.startsWith("JWT_SECRET=")) continue;
    const val = t.slice("JWT_SECRET=".length).trim();
    if (val) return val.replace(/^["']|["']$/g, "");
  }
  return null;
}

/** Persists JWT_SECRET to .env.local in development when missing. */
function bootstrapDevJwtSecret(): string {
  const generated = randomBytes(32).toString("base64url");
  const line = `\n# Auto-generated — do not commit\nJWT_SECRET=${generated}\n`;
  appendFileSync(ENV_LOCAL, line, "utf8");
  process.env.JWT_SECRET = generated;
  console.warn("[auth] JWT_SECRET was missing — wrote a new secret to .env.local (restart dev server once).");
  return generated;
}

/**
 * Resolves JWT signing secret from ENV.
 * In development only: may create JWT_SECRET in .env.local if absent.
 */
export function resolveJwtSecret(): string {
  if (cachedSecret) return cachedSecret;

  let secret = process.env.JWT_SECRET?.trim();
  if (!secret && process.env.NODE_ENV !== "production") {
    secret = readJwtSecretFromEnvLocal() ?? undefined;
    if (secret) process.env.JWT_SECRET = secret;
  }
  if (!secret && process.env.NODE_ENV !== "production") {
    secret = bootstrapDevJwtSecret();
  }
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }

  cachedSecret = secret;
  return secret;
}

export function jwtSecretKey(): Uint8Array {
  return new TextEncoder().encode(resolveJwtSecret());
}
