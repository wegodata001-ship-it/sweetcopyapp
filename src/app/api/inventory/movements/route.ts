import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function ok() {
  return NextResponse.json({ ok: true, data: null });
}

export const GET = ok;
export const POST = ok;
export const PATCH = ok;
export const PUT = ok;
export const DELETE = ok;
