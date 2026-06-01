import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDb } from "@/lib/api-route";

export const dynamic = "force-dynamic";

export async function GET() {
  const block = await requireDb();
  if (block) return block;
  const products = await prisma.hLWaitProduct.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: { inventory: true, supplier: { select: { name: true } } },
  });
  const data = products.map((p) => ({
    id:           p.id,
    name:         p.name,
    sku:          p.sku,
    currentStock: Number(p.currentStock),
    minStock:     Number(p.minStock),
    salePrice:    Number(p.salePrice),
    isActive:     p.isActive,
    supplierId:   p.supplierId,
    supplierName: p.supplier?.name ?? null,
    locations:    p.inventory.map((i) => ({
      location: i.location,
      quantity: Number(i.quantity),
    })),
  }));
  return NextResponse.json({ ok: true, data });
}

export async function POST(req: NextRequest) {
  const block = await requireDb();
  if (block) return block;

  const body = (await req.json()) as {
    name: string;
    sku?: string | null;
    salePrice?: number;
    currentStock?: number;
    minStock?: number;
    supplierId?: string | null;
  };

  if (!body.name?.trim()) {
    return NextResponse.json({ ok: false, error: "שם מוצר חובה" }, { status: 400 });
  }

  const product = await prisma.hLWaitProduct.create({
    data: {
      name:         body.name.trim(),
      sku:          body.sku?.trim() || null,
      salePrice:    body.salePrice    ?? 0,
      currentStock: body.currentStock ?? 0,
      minStock:     body.minStock     ?? 0,
      supplierId:   body.supplierId   || null,
    },
  });

  if (product.currentStock !== undefined) {
    await prisma.hLWaitInventory.create({
      data: {
        productId: product.id,
        location:  "default",
        quantity:  product.currentStock,
      },
    });
  }

  return NextResponse.json({ ok: true, data: product });
}
