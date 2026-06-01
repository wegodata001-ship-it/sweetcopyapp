// @ts-nocheck
import type { CashFlowEntry } from "@prisma/client";
import { prismaCashFlowToRow } from "@/lib/finance/cashflow-map";
import { parsePayload } from "@/lib/finance/document-payload";
import { isExpenseType, normalizeExpenseType, type ExpenseType } from "@/lib/finance/expense-types";
import { prisma } from "@/lib/prisma";
import type { CashFlowRow } from "@/lib/finance/types";
import { CASHFLOW_ENTRY_LIST_SELECT } from "@/lib/finance/cashflow-select";

export type CashflowListFilters = {
  entryType?: "income" | "expense" | null;
  expenseType?: ExpenseType | null;
  /** כל הרשומות — איטי; ברירת מחדל חלון תאריכים */
  all?: boolean;
  /** חודשים אחורה כש־all=false (ברירת מחדל 60) */
  months?: number;
};

function rowEntryTypeKey(entryType: string | null | undefined): string {
  return (entryType ?? "").trim().toLowerCase();
}

/** ממלא expense_type מתוך מסמך מקושר כשחסר בעמודה */
export async function enrichCashFlowRowsWithExpenseType(
  entries: CashFlowEntry[],
  rows: CashFlowRow[],
): Promise<CashFlowRow[]> {
  const needDoc = entries.filter(
    (e, i) =>
      !e.expenseType &&
      e.documentId &&
      rowEntryTypeKey(e.entryType) === "expense" &&
      !rows[i]?.expense_type,
  );
  if (!needDoc.length) return rows;

  const docIds = [...new Set(needDoc.map((e) => e.documentId!).filter(Boolean))];
  const docs = await prisma.financialDocument.findMany({
    where: { id: { in: docIds } },
    select: { id: true, metadata: true },
  });
  const byDoc = new Map(
    docs.map((d) => {
      const meta = parsePayload(d.metadata as unknown);
      const et = meta?.kind === "expense" ? normalizeExpenseType(meta.expenseType) : null;
      return [d.id, et] as const;
    }),
  );

  return rows.map((row) => {
    if (row.expense_type || rowEntryTypeKey(row.entry_type) !== "expense" || !row.document_id) {
      return row;
    }
    const fromDoc = byDoc.get(row.document_id) ?? null;
    return fromDoc ? { ...row, expense_type: fromDoc } : row;
  });
}

export function applyCashflowListFilters(rows: CashFlowRow[], filters: CashflowListFilters): CashFlowRow[] {
  let data = rows;
  const entryType = filters.entryType;
  if (entryType === "income") {
    data = data.filter((r) => rowEntryTypeKey(r.entry_type) === "income");
  } else if (entryType === "expense") {
    data = data.filter((r) => rowEntryTypeKey(r.entry_type) === "expense");
    const et = filters.expenseType;
    if (et) {
      data = data.filter((r) => r.expense_type === et);
    }
  }
  return data;
}

const DEFAULT_CASHFLOW_MONTHS = 60;
const MAX_CASHFLOW_MONTHS = 240;

export function parseCashflowQueryFilters(searchParams: URLSearchParams): CashflowListFilters {
  const entryTypeRaw = searchParams.get("entryType")?.trim().toLowerCase();
  const entryType =
    entryTypeRaw === "income" || entryTypeRaw === "expense" ? entryTypeRaw : null;
  const expenseTypeRaw = searchParams.get("expenseType")?.trim();
  const expenseType =
    entryType === "expense" && expenseTypeRaw && isExpenseType(expenseTypeRaw)
      ? expenseTypeRaw
      : null;
  const all = searchParams.get("all") === "1" || searchParams.get("all") === "true";
  const monthsRaw = Number(searchParams.get("months") ?? String(DEFAULT_CASHFLOW_MONTHS));
  const months = Number.isFinite(monthsRaw)
    ? Math.min(Math.max(1, Math.floor(monthsRaw)), MAX_CASHFLOW_MONTHS)
    : DEFAULT_CASHFLOW_MONTHS;
  return { entryType, expenseType, all, months };
}

function cashflowDateCutoff(months: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function listCashFlowRows(filters: CashflowListFilters): Promise<CashFlowRow[]> {
  const where =
    filters.all === true
      ? undefined
      : { entryDate: { gte: cashflowDateCutoff(filters.months ?? DEFAULT_CASHFLOW_MONTHS) } };

  const rows = await prisma.cashFlowEntry.findMany({
    where,
    select: CASHFLOW_ENTRY_LIST_SELECT,
    orderBy: [{ entryDate: "asc" }, { createdAt: "asc" }],
  });
  let mapped = rows.map((row) => prismaCashFlowToRow(row));
  mapped = await enrichCashFlowRowsWithExpenseType(rows, mapped);
  return applyCashflowListFilters(mapped, filters);
}
