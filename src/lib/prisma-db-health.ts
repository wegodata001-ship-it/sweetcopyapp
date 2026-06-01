import { Prisma } from "@prisma/client";

/** שגיאות חיבור ל-Supabase / Postgres (לא זמין, timeout, רשת) */
export function isDbConnectionError(e: unknown): boolean {
  if (e instanceof Prisma.PrismaClientInitializationError) return true;
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    return e.code === "P1001" || e.code === "P1002" || e.code === "P1017";
  }
  const msg = e instanceof Error ? e.message : String(e);
  return (
    msg.includes("Can't reach database server") ||
    msg.includes("Connection timed out") ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("ENOTFOUND") ||
    msg.includes("Connection pool")
  );
}

