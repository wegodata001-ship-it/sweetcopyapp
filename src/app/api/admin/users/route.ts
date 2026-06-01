import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDb } from "@/lib/api-route";
import { hashPassword } from "@/lib/auth/password";
import { toApiUser } from "@/lib/auth/user-dto";

export const dynamic = "force-dynamic";

export async function GET() {
  const block = await requireDb();
  if (block) return block;
  const rows = await prisma.hLWaitUser.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  });
  return NextResponse.json({
    ok: true,
    data: rows.map((r) => ({ ...toApiUser(r), permissions: [] })),
  });
}

export async function POST(req: NextRequest) {
  const block = await requireDb();
  if (block) return block;
  const body = (await req.json()) as {
    fullName?: string;
    name?: string;
    email: string;
    password: string;
    role?: string;
  };
  const name = (body.fullName ?? body.name)?.trim();
  const email = body.email?.trim().toLowerCase();
  if (!name || !email || !body.password) {
    return NextResponse.json({ ok: false, error: "שם, אימייל וסיסמה חובה" }, { status: 400 });
  }
  const passwordHash = await hashPassword(body.password);
  const row = await prisma.hLWaitUser.create({
    data: {
      name,
      email,
      passwordHash,
      role: body.role === "admin" ? "admin" : "employee",
      isActive: true,
    },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
  return NextResponse.json({ ok: true, data: toApiUser(row) });
}
