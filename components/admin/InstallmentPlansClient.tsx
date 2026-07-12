"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  Printer,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Check,
  Undo2,
  AlertTriangle,
  Loader2,
  Wallet,
  ExternalLink,
} from "lucide-react";
import type { ManualBooking, Installment } from "@/lib/types";
import { summarizeInstallments, installmentIsOverdue } from "@/lib/installments";
import { formatPrice } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";

type TripLite = {
  id: string;
  title: string;
  date: string;
  destination: string;
  duration: string;
  slug: string;
};

type Plan = { booking: ManualBooking; trip: TripLite };

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function printCarne({ booking, trip }: Plan) {
  const installments = booking.installments ?? [];
  const w = window.open("", "_blank", "width=650,height=850");
  if (!w) return;
  const parcelasHtml = installments
    .map(
      (i) => `<p class="row ${i.status === "pago" ? "paga" : ""}">* ${escapeHtml(
        i.dueDate
      )}: ${
        i.status === "pago"
          ? `PAGO${i.paidAt ? " em " + escapeHtml(i.paidAt) : ""} ✓`
          : escapeHtml(formatPrice(i.amount))
      }</p>`
    )
    .join("");

  w.document.write(`<!doctype html><html><head><meta charset="utf-8">
    <title>Carnê — ${escapeHtml(booking.buyerName)}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 32px; color: #211d1d; font-size: 14px; line-height: 1.6; }
      h1 { font-size: 22px; margin: 0; letter-spacing: 1px; }
      .sub { color: #b5766b; font-weight: bold; margin: 2px 0 22px; font-style: italic; }
      .row { margin: 3px 0; }
      .label { font-weight: bold; }
      .section-title { margin-top: 22px; font-weight: bold; text-decoration: underline; }
      .paga { color: #1a9b60; font-weight: bold; }
      .footer { margin-top: 26px; }
      .final { margin-top: 18px; font-weight: bold; text-align: center; letter-spacing: 0.5px; }
      @media print { body { margin: 12mm; } }
    </style></head><body>
    <h1>SITUR</h1>
    <p class="sub">Sandra e Ivonete Turismo</p>
    <p class="row"><span class="label">Destino:</span> ${escapeHtml(trip.destination)} — ${escapeHtml(trip.title)}</p>
    <p class="row"><span class="label">Data:</span> ${escapeHtml(trip.date)}${trip.duration ? ` (${escapeHtml(trip.duration)})` : ""}</p>
    <p class="row"><span class="label">Nome:</span> ${escapeHtml(booking.buyerName)}</p>
    ${booking.phone ? `<p class="row"><span class="label">Contato:</span> ${escapeHtml(booking.phone)}</p>` : ""}
    ${booking.buyerDocument ? `<p class="row"><span class="label">CPF:</span> ${escapeHtml(booking.buyerDocument)}</p>` : ""}
    ${booking.buyerBirthDate ? `<p class="row"><span class="label">Nascimento:</span> ${escapeHtml(booking.buyerBirthDate)}</p>` : ""}
    ${booking.buyerAddress ? `<p class="row"><span class="label">Endereço:</span> ${escapeHtml(booking.buyerAddress)}</p>` : ""}
    ${booking.buyerCep ? `<p class="row"><span class="label">CEP:</span> ${escapeHtml(booking.buyerCep)}</p>` : ""}

    <p class="section-title">PRESTAÇÃO DE PAGAMENTOS:</p>
    <p class="row"><span class="label">VALOR:</span> ${escapeHtml(formatPrice(booking.amount))}</p>
    <p class="row"><span class="label">Parcelas:</span> ${installments.length} x ${escapeHtml(formatPrice(installments[0]?.amount ?? 0))}</p>
    <p class="row"><span class="label">Forma de pagamento:</span> Pix</p>
    ${parcelasHtml}
    <p class="row" style="margin-top:12px"><span class="label">Observação:</span> ${escapeHtml(
      booking.notes || "Envie seu comprovante para o controle das baixas de pagamento."
    )}</p>

    <p class="footer">Atenciosamente,<br/><b>SITUR Turismo com amizade!</b></p>
    <p class="row" style="margin-top:14px">Mais informações ou dúvidas:</p>
    <p class="row">Sandra: ${escapeHtml(siteConfig.phone)}</p>
    <p class="row">Ivonete: ${escapeHtml(siteConfig.phone2)}</p>
    <p class="final">VEM SER FELIZ COM A GENTE!</p>
    </body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}

function whatsappCarneLink({ booking, trip }: Plan): string | null {
  if (!booking.phone) return null;
  const digits = booking.phone.replace(/\D/g, "");
  if (!digits) return null;
  const to = digits.startsWith("55") ? digits : `55${digits}`;
  const installments = booking.installments ?? [];
  const lines = [
    "SITUR — Sandra e Ivonete Turismo",
    "",
    `Destino: ${trip.destination} — ${trip.title}`,
    `Data: ${trip.date}`,
    `Nome: ${booking.buyerName}`,
    "",
    "PRESTAÇÃO DE PAGAMENTOS:",
    `Valor: ${formatPrice(booking.amount)}`,
    `Parcelas: ${installments.length} x ${formatPrice(installments[0]?.amount ?? 0)}`,
    "Forma de pagamento: Pix",
    ...installments.map(
      (i) => `* ${i.dueDate}: ${i.status === "pago" ? "PAGO ✅" : formatPrice(i.amount)}`
    ),
    "",
    "Envie seu comprovante para o controle das baixas de pagamento.",
    "",
    "Mais informações ou dúvidas:",
    `Sandra: ${siteConfig.phone}`,
    `Ivonete: ${siteConfig.phone2}`,
    "",
    "VEM SER FELIZ COM A GENTE!",
  ];
  return `https://wa.me/${to}?text=${encodeURIComponent(lines.join("\n"))}`;
}

export default function InstallmentPlansClient() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [busyInstallment, setBusyInstallment] = useState<string | null>(null);
  const [showFullyPaid, setShowFullyPaid] = useState(false);

  // Evita que baixas clicadas em sequência rápida (cada uma dispara seu
  // próprio load()) sobrescrevam o estado com uma resposta desatualizada
  // caso as chamadas terminem fora de ordem.
  const loadSeq = useRef(0);

  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    const [bookingsRes, tripsRes] = await Promise.all([
      fetch("/api/admin/manual-bookings"),
      fetch("/api/admin/trips"),
    ]);
    const bookings: ManualBooking[] = bookingsRes.ok ? await bookingsRes.json() : [];
    const trips: TripLite[] = tripsRes.ok ? await tripsRes.json() : [];
    const tripMap = new Map(trips.map((t) => [t.id, t]));
    const list: Plan[] = bookings
      .filter((b) => b.paymentMethod === "parcelado" && b.installments?.length)
      .map((b) => ({
        booking: b,
        trip: tripMap.get(b.tripId) ?? {
          id: b.tripId,
          title: "Viagem removida",
          date: "",
          destination: "",
          duration: "",
          slug: "",
        },
      }))
      .sort((a, b) => a.booking.buyerName.localeCompare(b.booking.buyerName));
    if (seq !== loadSeq.current) return; // uma chamada mais nova já respondeu
    setPlans(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function toggleInstallment(bookingId: string, installment: Installment) {
    setBusyInstallment(installment.id);
    const nextStatus = installment.status === "pago" ? "pendente" : "pago";
    try {
      await fetch(`/api/admin/manual-bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ installmentId: installment.id, status: nextStatus }),
      });
      await load();
    } finally {
      setBusyInstallment(null);
    }
  }

  const globalSummary = useMemo(() => {
    let totalRemaining = 0;
    let totalPaid = 0;
    let overdueCount = 0;
    let activeCount = 0;
    for (const { booking } of plans) {
      const s = summarizeInstallments(booking.installments ?? []);
      totalRemaining += s.remainingAmount;
      totalPaid += s.paidAmount;
      overdueCount += s.overdueCount;
      if (!s.fullyPaid) activeCount += 1;
    }
    return { totalRemaining, totalPaid, overdueCount, activeCount };
  }, [plans]);

  const visiblePlans = plans.filter(({ booking }) => {
    const summary = summarizeInstallments(booking.installments ?? []);
    return showFullyPaid || !summary.fullyPaid;
  });

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-graphite/55">
        <Loader2 size={16} className="animate-spin" />
        Carregando parcelamentos...
      </p>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-graphite">
          Parcelamentos
        </h1>
        <p className="mt-1 text-sm text-graphite/55">
          Carnês de Pix parcelado de todas as viagens — dê baixa nas parcelas
          conforme os comprovantes chegarem.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl bg-white p-6 shadow-soft">
          <p className="text-xs uppercase tracking-wider text-graphite/50">
            Carnês ativos
          </p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-graphite">
            {globalSummary.activeCount}
          </p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-soft">
          <p className="text-xs uppercase tracking-wider text-graphite/50">
            Recebido via carnê
          </p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-[#1a9b60]">
            {formatPrice(globalSummary.totalPaid)}
          </p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-soft">
          <p className="text-xs uppercase tracking-wider text-graphite/50">
            A receber
          </p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-graphite">
            {formatPrice(globalSummary.totalRemaining)}
          </p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-soft">
          <p className="text-xs uppercase tracking-wider text-graphite/50">
            Parcelas em atraso
          </p>
          <p
            className={`mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold ${
              globalSummary.overdueCount > 0 ? "text-rose" : "text-graphite"
            }`}
          >
            {globalSummary.overdueCount}
          </p>
        </div>
      </div>

      <label className="mb-4 flex items-center gap-2 text-sm text-graphite/60">
        <input
          type="checkbox"
          checked={showFullyPaid}
          onChange={(e) => setShowFullyPaid(e.target.checked)}
          className="h-4 w-4 accent-rose"
        />
        Mostrar carnês já quitados
      </label>

      <div className="space-y-5">
        {visiblePlans.map((plan) => {
          const { booking, trip } = plan;
          const installments = booking.installments ?? [];
          const summary = summarizeInstallments(installments);
          const isOpen = expanded.has(booking.id);
          const waLink = whatsappCarneLink(plan);

          return (
            <div key={booking.id} className="rounded-3xl bg-white p-6 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/15 text-gold-dark">
                      <CreditCard size={16} />
                    </span>
                    <div>
                      <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-graphite">
                        {booking.buyerName}
                      </p>
                      <p className="text-xs text-graphite/55">
                        {trip.title}
                        {trip.date ? ` · ${trip.date}` : ""}
                        {booking.buyerDocument ? ` · CPF ${booking.buyerDocument}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {summary.fullyPaid && (
                    <span className="rounded-full bg-[#1a9b60]/10 px-3 py-1.5 text-[11px] font-semibold text-[#1a9b60]">
                      Quitado
                    </span>
                  )}
                  {summary.overdueCount > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-rose/10 px-3 py-1.5 text-[11px] font-semibold text-rose">
                      <AlertTriangle size={12} />
                      {summary.overdueCount} atrasada
                      {summary.overdueCount === 1 ? "" : "s"}
                    </span>
                  )}
                  <Link
                    href={`/admin/viagens/${trip.id}/passageiros`}
                    title="Editar venda na Lista de Embarque"
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-graphite/45 hover:bg-blush hover:text-rose-dark"
                  >
                    <ExternalLink size={15} />
                  </Link>
                  <button
                    onClick={() => printCarne(plan)}
                    title="Imprimir carnê"
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-graphite/45 hover:bg-blush hover:text-rose-dark"
                  >
                    <Printer size={15} />
                  </button>
                  {waLink && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Enviar carnê por WhatsApp"
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-[#25D366] hover:bg-[#25D366]/10"
                    >
                      <MessageCircle size={15} />
                    </a>
                  )}
                  <button
                    onClick={() => toggleExpand(booking.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-graphite/45 hover:bg-blush hover:text-rose-dark"
                  >
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Progresso */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-graphite/55">
                  <span>
                    {summary.paidCount} de {summary.totalCount} parcelas pagas
                  </span>
                  <span>
                    {formatPrice(summary.paidAmount)} / {formatPrice(summary.totalAmount)}
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-blush">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gold to-rose"
                    style={{
                      width: `${summary.totalCount ? Math.round((summary.paidCount / summary.totalCount) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>

              {isOpen && (
                <div className="mt-5 space-y-2 border-t border-graphite/8 pt-5">
                  {installments.map((inst) => {
                    const overdue = installmentIsOverdue(inst);
                    return (
                      <div
                        key={inst.id}
                        className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 ${
                          inst.status === "pago"
                            ? "border-[#1a9b60]/20 bg-[#1a9b60]/5"
                            : overdue
                              ? "border-rose/30 bg-rose/5"
                              : "border-graphite/10"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-xs font-bold text-graphite/60 shadow-soft">
                            {inst.number}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-graphite">
                              {formatPrice(inst.amount)}
                            </p>
                            <p
                              className={`text-xs ${
                                overdue ? "font-semibold text-rose" : "text-graphite/50"
                              }`}
                            >
                              Vencimento {inst.dueDate}
                              {overdue ? " · atrasada" : ""}
                              {inst.status === "pago" && inst.paidAt
                                ? ` · pago em ${inst.paidAt}`
                                : ""}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleInstallment(booking.id, inst)}
                          disabled={busyInstallment === inst.id}
                          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${
                            inst.status === "pago"
                              ? "bg-graphite/10 text-graphite/60 hover:bg-graphite/15"
                              : "bg-[#1a9b60] text-white hover:bg-[#158049]"
                          }`}
                        >
                          {busyInstallment === inst.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : inst.status === "pago" ? (
                            <Undo2 size={13} />
                          ) : (
                            <Check size={13} />
                          )}
                          {inst.status === "pago" ? "Desfazer baixa" : "Dar baixa"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {visiblePlans.length === 0 && (
          <div className="rounded-3xl bg-white p-12 text-center text-graphite/45 shadow-soft">
            <Wallet size={28} className="mx-auto mb-3 text-graphite/25" />
            Nenhum carnê {showFullyPaid ? "" : "em aberto "}ainda. Crie um
            escolhendo a forma de pagamento &quot;Pix Parcelado (Carnê)&quot;
            ao registrar uma venda no balcão de qualquer viagem.
          </div>
        )}
      </div>
    </div>
  );
}
