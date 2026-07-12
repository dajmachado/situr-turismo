import type { Installment } from "./types";
import { newId } from "./utils";

function parseBrDate(br: string): Date | null {
  const m = br.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

function toBrDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Soma N meses a uma data, "grudando" no último dia se o mês for mais curto. */
function addMonths(d: Date, months: number): Date {
  const day = d.getDate();
  const target = new Date(d.getFullYear(), d.getMonth() + months, 1);
  const lastDayOfTarget = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0
  ).getDate();
  target.setDate(Math.min(day, lastDayOfTarget));
  return target;
}

/**
 * Gera as parcelas de um carnê: valor dividido igualmente (ajustando
 * centavos de arredondamento na última parcela) e vencimentos mensais a
 * partir da data da primeira parcela.
 */
export function generateInstallments(
  totalAmount: number,
  count: number,
  firstDueDate: string
): Installment[] {
  const n = Math.max(1, Math.floor(count));
  const totalCents = Math.round(totalAmount * 100);
  const baseCents = Math.floor(totalCents / n);
  const remainderCents = totalCents - baseCents * n;

  const firstDate = parseBrDate(firstDueDate) ?? new Date();

  return Array.from({ length: n }, (_, i) => {
    const cents = baseCents + (i === n - 1 ? remainderCents : 0);
    return {
      id: newId(),
      number: i + 1,
      dueDate: toBrDate(addMonths(firstDate, i)),
      amount: Number((cents / 100).toFixed(2)),
      status: "pendente" as const,
    };
  });
}

export type InstallmentPlanSummary = {
  totalCount: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  nextDue?: Installment;
  fullyPaid: boolean;
};

function isOverdue(installment: Installment, today: Date): boolean {
  if (installment.status === "pago") return false;
  const due = parseBrDate(installment.dueDate);
  if (!due) return false;
  due.setHours(23, 59, 59, 999);
  return due.getTime() < today.getTime();
}

export function summarizeInstallments(
  installments: Installment[]
): InstallmentPlanSummary {
  const today = new Date();
  const paid = installments.filter((i) => i.status === "pago");
  const pending = installments.filter((i) => i.status === "pendente");
  const overdue = pending.filter((i) => isOverdue(i, today));
  const totalAmount = installments.reduce((s, i) => s + i.amount, 0);
  const paidAmount = paid.reduce((s, i) => s + (i.paidAmount ?? i.amount), 0);
  const nextDue = pending
    .slice()
    .sort((a, b) => {
      const da = parseBrDate(a.dueDate)?.getTime() ?? 0;
      const db = parseBrDate(b.dueDate)?.getTime() ?? 0;
      return da - db;
    })
    .at(0);

  return {
    totalCount: installments.length,
    paidCount: paid.length,
    pendingCount: pending.length,
    overdueCount: overdue.length,
    totalAmount,
    paidAmount,
    remainingAmount: Math.max(0, totalAmount - paidAmount),
    nextDue,
    fullyPaid: installments.length > 0 && paid.length === installments.length,
  };
}

export function installmentIsOverdue(installment: Installment): boolean {
  return isOverdue(installment, new Date());
}
