import { prisma } from "@/lib/prisma";
import {
  incomeExpenseTotalToPay,
  parsePayload,
  type FinanceDocumentPayload,
  type IncomeExpensePayload,
} from "@/lib/finance/document-payload";
import type { FinanceDocumentRow } from "@/lib/finance/types";

type DocKind = "income" | "expense" | "payment";

function toDateOnly(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  const date = d instanceof Date ? d : new Date(d);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function storagePathFromUrl(url: string | null | undefined, bucket: string | null): string | null {
  if (!url || !bucket) return null;
  const marker = `/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx < 0) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

function bucketFromAttachment(url?: string | null): string | null {
  if (!url) return null;
  return process.env.SUPABASE_STORAGE_BUCKET?.trim() || null;
}

function payloadForIncome(row: {
  description: string;
  incomeDate: Date | string;
  amount: unknown;
  customer?: { name: string } | null;
  fileUrl?: string | null;
  fileName?: string | null;
}): IncomeExpensePayload {
  return {
    kind: "income",
    clientMode: "general",
    counterpartyName: row.customer?.name ?? "",
    docDate: toDateOnly(row.incomeDate) ?? "",
    documentType: row.description || "הכנסה",
    paymentMethod: "",
    paymentPaidAmount: "",
    paymentInstrument: "CASH",
    paymentNotes: "",
    payments: [],
    paymentMethods: [],
    includeDeposit: false,
    depositAmount: "",
    depositType: "OTHER",
    depositNote: "",
    depositStatus: "open",
    trayQty: "",
    returnDate: "",
    lines: [{ id: "line-1", itemName: row.description || "הכנסה", quantity: "1", price: String(row.amount ?? 0), vatMode: "includes_vat" }],
    receiptFileUrl: row.fileUrl ?? null,
    receiptFileName: row.fileName ?? null,
  };
}

function payloadForExpense(row: {
  description: string;
  expenseDate: Date | string;
  amount: unknown;
  supplierId?: string | null;
  employeeId?: string | null;
  supplier?: { name: string } | null;
  fileUrl?: string | null;
  fileName?: string | null;
}): IncomeExpensePayload {
  return {
    kind: "expense",
    clientMode: "general",
    expenseType: "SUPPLIER_PAYMENTS",
    counterpartyName: row.supplier?.name ?? "",
    docDate: toDateOnly(row.expenseDate) ?? "",
    documentType: row.description || "הוצאה",
    paymentMethod: "",
    paymentPaidAmount: "",
    paymentInstrument: "CASH",
    paymentNotes: "",
    payments: [],
    paymentMethods: [],
    includeDeposit: false,
    depositAmount: "",
    depositType: "OTHER",
    depositNote: "",
    depositStatus: "open",
    trayQty: "",
    returnDate: "",
    supplierId: row.supplierId ?? null,
    employeeId: row.employeeId ?? null,
    lines: [{ id: "line-1", itemName: row.description || "הוצאה", quantity: "1", price: String(row.amount ?? 0), vatMode: "includes_vat" }],
    receiptFileUrl: row.fileUrl ?? null,
    receiptFileName: row.fileName ?? null,
  };
}

function documentRow(input: {
  id: string;
  kind: DocKind;
  title: string;
  amount: number;
  paidAmount?: number;
  docDate: Date | string | null;
  customerId?: string | null;
  customerName?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  storagePath?: string | null;
  createdAt: Date | string;
  payload: FinanceDocumentPayload | null;
}): FinanceDocumentRow {
  const category = input.kind === "expense" ? "הוצאה" : input.kind === "payment" ? "תשלום" : "הכנסה";
  const paidAmount = input.paidAmount ?? (input.kind === "income" ? 0 : input.amount);
  return {
    id: input.id,
    title: input.title,
    category,
    document_type: input.title,
    customer_id: input.customerId ?? null,
    customer_name: input.customerName ?? null,
    total_amount: input.amount,
    paid_amount: paidAmount,
    remaining_amount: Math.max(0, input.amount - paidAmount),
    payment_status: input.amount <= 0 ? "unpaid" : input.amount - paidAmount <= 0 ? "paid" : paidAmount > 0 ? "partial" : "unpaid",
    deposit_amount: 0,
    deposit_type: null,
    deposit_note: null,
    deposit_status: null,
    doc_date: toDateOnly(input.docDate),
    pdf_storage_path: input.storagePath ?? null,
    sent_to_cpa: false,
    sent_to_cpa_at: null,
    sent_to_cpa_by: null,
    created_at: input.createdAt instanceof Date ? input.createdAt.toISOString() : new Date(input.createdAt).toISOString(),
    payload: input.payload,
  };
}

export async function listPublicFinanceDocuments(): Promise<FinanceDocumentRow[]> {
  const [income, expenses, payments] = await Promise.all([
    prisma.hLWaitIncome.findMany({
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.hLWaitExpense.findMany({
      include: { supplier: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.hLWaitPayment.findMany({
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return [
    ...income.map((row) =>
      documentRow({
        id: row.id,
        kind: "income",
        title: row.description || "הכנסה",
        amount: Number(row.amount),
        paidAmount: 0,
        docDate: row.incomeDate,
        customerId: row.customerId,
        customerName: row.customer?.name ?? null,
        fileUrl: row.fileUrl,
        fileName: row.fileName,
        storagePath: row.storagePath,
        createdAt: row.createdAt,
        payload: payloadForIncome(row),
      }),
    ),
    ...expenses.map((row) =>
      documentRow({
        id: row.id,
        kind: "expense",
        title: row.description || "הוצאה",
        amount: Number(row.amount),
        docDate: row.expenseDate,
        fileUrl: row.fileUrl,
        fileName: row.fileName,
        storagePath: row.storagePath,
        createdAt: row.createdAt,
        payload: payloadForExpense(row),
      }),
    ),
    ...payments.map((row) =>
      documentRow({
        id: row.id,
        kind: "payment",
        title: row.notes || "תשלום",
        amount: Number(row.amount),
        paidAmount: Number(row.amount),
        docDate: row.paidAt,
        customerId: row.customerId,
        customerName: row.customer?.name ?? null,
        fileUrl: row.fileUrl,
        fileName: row.fileName,
        storagePath: row.storagePath,
        createdAt: row.createdAt,
        payload: null,
      }),
    ),
  ].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getPublicFinanceDocument(id: string): Promise<FinanceDocumentRow | null> {
  const income = await prisma.hLWaitIncome.findUnique({
    where: { id },
    include: { customer: { select: { name: true } } },
  });
  if (income) {
    return documentRow({
      id: income.id,
      kind: "income",
      title: income.description || "הכנסה",
      amount: Number(income.amount),
      docDate: income.incomeDate,
      customerId: income.customerId,
      customerName: income.customer?.name ?? null,
      fileUrl: income.fileUrl,
      fileName: income.fileName,
      storagePath: income.storagePath,
      createdAt: income.createdAt,
      payload: payloadForIncome(income),
    });
  }

  const expense = await prisma.hLWaitExpense.findUnique({
    where: { id },
    include: { supplier: { select: { name: true } } },
  });
  if (expense) {
    return documentRow({
      id: expense.id,
      kind: "expense",
      title: expense.description || "הוצאה",
      amount: Number(expense.amount),
      docDate: expense.expenseDate,
      fileUrl: expense.fileUrl,
      fileName: expense.fileName,
      storagePath: expense.storagePath,
      createdAt: expense.createdAt,
      payload: payloadForExpense(expense),
    });
  }

  return null;
}

async function findOrCreateCustomer(name: string | null | undefined): Promise<string | null> {
  const n = name?.trim();
  if (!n) return null;
  const existing = await prisma.hLWaitCustomer.findFirst({ where: { name: n }, select: { id: true } });
  if (existing) return existing.id;
  const created = await prisma.hLWaitCustomer.create({ data: { name: n }, select: { id: true } });
  return created.id;
}

export async function createPublicFinanceDocument(input: {
  title: string;
  category: string;
  docDate: string | null;
  payload: unknown;
}): Promise<{ id: string }> {
  const payload = parsePayload(input.payload);
  if (!payload) throw new Error("payload לא תקין");

  if (payload.kind === "expense") {
    const bucket = bucketFromAttachment(payload.receiptFileUrl);
    const row = await prisma.hLWaitExpense.create({
      data: {
        amount: incomeExpenseTotalToPay(payload),
        description: input.title,
        supplierId: payload.supplierId || null,
        employeeId: payload.employeeId || null,
        expenseDate: input.docDate ? new Date(input.docDate) : new Date(),
        fileUrl: payload.receiptFileUrl ?? null,
        fileName: payload.receiptFileName ?? null,
        bucketName: bucket,
        storagePath: storagePathFromUrl(payload.receiptFileUrl, bucket),
      },
      select: { id: true },
    });
    return { id: row.id };
  }

  if (payload.kind === "income") {
    const customerId = await findOrCreateCustomer(payload.counterpartyName);
    const bucket = bucketFromAttachment(payload.receiptFileUrl);
    const row = await prisma.hLWaitIncome.create({
      data: {
        amount: incomeExpenseTotalToPay(payload),
        description: input.title,
        customerId,
        incomeDate: input.docDate ? new Date(input.docDate) : new Date(),
        fileUrl: payload.receiptFileUrl ?? null,
        fileName: payload.receiptFileName ?? null,
        bucketName: bucket,
        storagePath: storagePathFromUrl(payload.receiptFileUrl, bucket),
      },
      select: { id: true },
    });
    return { id: row.id };
  }

  const zPayload = payload as Extract<FinanceDocumentPayload, { kind: "zreport" }>;
  const row = await prisma.hLWaitIncome.create({
    data: {
      amount: Number(zPayload.cashTaxable || 0) + Number(zPayload.cashExempt || 0) + Number(zPayload.creditTaxable || 0) + Number(zPayload.creditExempt || 0) + Number(zPayload.transfers || 0),
      description: input.title,
      incomeDate: input.docDate ? new Date(input.docDate) : new Date(),
    },
    select: { id: true },
  });
  return { id: row.id };
}

export async function patchPublicFinanceDocument(
  id: string,
  patch: { title?: string; doc_date?: string | null; payload?: unknown },
): Promise<boolean> {
  const existing = await getPublicFinanceDocument(id);
  if (!existing) return false;
  const payload = patch.payload ? parsePayload(patch.payload) : existing.payload;
  const amount = payload && payload.kind !== "zreport" ? incomeExpenseTotalToPay(payload) : existing.total_amount;

  if (existing.category === "הוצאה") {
    await prisma.hLWaitExpense.update({
      where: { id },
      data: {
        ...(patch.title !== undefined ? { description: patch.title } : {}),
        ...(patch.doc_date !== undefined ? { expenseDate: patch.doc_date ? new Date(patch.doc_date) : new Date() } : {}),
        ...(patch.payload !== undefined ? { amount } : {}),
      },
    });
    return true;
  }

  await prisma.hLWaitIncome.update({
    where: { id },
    data: {
      ...(patch.title !== undefined ? { description: patch.title } : {}),
      ...(patch.doc_date !== undefined ? { incomeDate: patch.doc_date ? new Date(patch.doc_date) : new Date() } : {}),
      ...(patch.payload !== undefined ? { amount } : {}),
    },
  });
  return true;
}

export async function deletePublicFinanceDocument(id: string): Promise<boolean> {
  const existing = await getPublicFinanceDocument(id);
  if (!existing) return false;
  if (existing.category === "הוצאה") await prisma.hLWaitExpense.delete({ where: { id } });
  else await prisma.hLWaitIncome.delete({ where: { id } });
  return true;
}
