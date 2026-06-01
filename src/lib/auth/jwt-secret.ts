let cachedSecret: string | null = null;

/**
 * JWT signing secret from ENV only (Edge-safe — no fs).
 * Set JWT_SECRET in .env.local / Vercel Environment Variables.
 */
export function resolveJwtSecret(): string {
  if (cachedSecret) return cachedSecret;

  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }

  cachedSecret = secret;
  return secret;
}

export function jwtSecretKey(): Uint8Array {
  return new TextEncoder().encode(resolveJwtSecret());
}
