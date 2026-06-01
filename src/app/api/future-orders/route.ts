// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDb } from "@/lib/api-route";
import { getSessionFromCookie } from "@/lib/auth/get-session";
import {
  canViewWeddingOrders,
  ORDER_CATEGORY_DAILY,
  ORDER_CATEGORY_WEDDING,
  isValidOrderCategory,
  isValidStatus,
  orderToFutureOrder,
  type OrderCategory,
} from "@/lib/future-orders/helpers";

export const dynamic = "force-dynamic";

async function nextOrderNumber(): Promise<string> {
  const count = await prisma.hLWaitOrder.count();
  return `ORD-${String(count + 1).padStart(4, "0")}`;
}

function parseCategory(sp: URLSearchParams): OrderCategory {
  const raw = (sp.get("category") ?? ORDER_CATEGORY_DAILY).trim();
  if (raw === ORDER_CATEGORY_WEDDING || raw === "wedding") return ORDER_CATEGORY_WEDDING;
  return ORDER_CATEGORY_DAILY;
}

export async function GET(req: NextRequest) {
  const block = await requireDb();
  if (block) return block;
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ ok: false, error: "לא מחובר" }, { status: 401 });
  }

  const category = parseCategory(req.nextUrl.searchParams);
  if (category === ORDER_CATEGORY_WEDDING && !canViewWeddingOrders(session)) {
    return NextResponse.json({ ok: false, error: "אין הרשאה" }, { status: 403 });
  }

  const status = req.nextUrl.searchParams.get("status")?.trim();
  const q = req.nextUrl.searchParams.get("q")?.trim();

  const rows = await prisma.hLWaitOrder.findMany({
    where: {
      ...(status && isValidStatus(status) ? { status } : {}),
      ...(q
        ? {
            OR: [
              { orderNumber: { contains: q, mode: "insensitive" } },
              { notes: { contains: q, mode: "insensitive" } },
              { customer: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({
    ok: true,
    data: rows.map((r) => orderToFutureOrder(r, category)),
  });
}

export async function POST(req: NextRequest) {
  const block = await requireDb();
  if (block) return block;
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ ok: false, error: "לא מחובר" }, { status: 401 });
  }

  const body = (await req.json()) as {
    customerName: string;
    phone?: string | null;
    totalAmount: number;
    notes?: string | null;
    orderCategory?: string;
    status?: string;
  };

  const category = isValidOrderCategory(body.orderCategory ?? "")
    ? body.orderCategory!
    : ORDER_CATEGORY_DAILY;

  let customer = await prisma.hLWaitCustomer.findFirst({
    where: { name: { equals: body.customerName.trim(), mode: "insensitive" } },
  });
  if (!customer) {
    customer = await prisma.hLWaitCustomer.create({
      data: { name: body.customerName.trim(), phone: body.phone?.trim() || null },
    });
  }

  const order = await prisma.hLWaitOrder.create({
    data: {
      orderNumber: await nextOrderNumber(),
      customerId: customer.id,
      total: body.totalAmount,
      status: body.status?.trim() || "open",
      notes: body.notes?.trim() || null,
    },
    include: { customer: true },
  });

  return NextResponse.json({ ok: true, data: orderToFutureOrder(order, category as OrderCategory) });
}
