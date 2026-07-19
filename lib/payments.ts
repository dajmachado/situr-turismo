import type { Payment } from "./types";

export type PaymentLogSummary = {
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  fullyPaid: boolean;
};

/**
 * Resume um log de pagamentos avulsos (forma "Pagamento Parcial"): soma o
 * que já foi lançado e calcula o saldo devedor — sem parcelas fixas nem
 * vencimento, ao contrário do carnê (ver lib/installments.ts).
 */
export function summarizePayments(
  totalAmount: number,
  payments: Payment[]
): PaymentLogSummary {
  const paidAmount = payments.reduce((s, p) => s + p.amount, 0);
  return {
    totalAmount,
    paidAmount,
    remainingAmount: Math.max(0, totalAmount - paidAmount),
    fullyPaid: totalAmount > 0 && paidAmount >= totalAmount,
  };
}
