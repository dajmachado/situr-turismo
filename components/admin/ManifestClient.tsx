"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Printer,
  Download,
  Pencil,
  Trash2,
  X,
  Loader2,
  Store,
  Globe,
  Wallet,
  MessageCircle,
  CreditCard,
  Wand2,
} from "lucide-react";
import type {
  ManualBooking,
  PaymentMethod,
  Installment,
  Payment,
} from "@/lib/types";
import { PAYMENT_METHOD_LABELS } from "@/lib/types";
import type { BusLayout } from "@/lib/bus";
import { compareSeatIds, seatLabel } from "@/lib/bus";
import { confirmationWhatsAppLink } from "@/lib/confirmation-message";
import type { Manifest } from "@/lib/manifest";
import { formatPrice, newId } from "@/lib/utils";
import { generateInstallments } from "@/lib/installments";
import { summarizePayments } from "@/lib/payments";
import PhoneInput from "@/components/PhoneInput";
import CurrencyInput from "@/components/CurrencyInput";
import BusSeatMap from "@/components/checkout/BusSeatMap";
import DateField from "./DateField";

type TripInfo = {
  id: string;
  title: string;
  date: string;
  destination: string;
  slug: string;
  price: number;
};

type ApiData = {
  trip: TripInfo;
  manifest: Manifest;
  layout: BusLayout;
  occupied: string[];
  manualBookings: ManualBooking[];
};

const inputClass =
  "w-full rounded-xl border border-graphite/15 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rose";
const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-graphite/55";

const statusStyle: Record<string, string> = {
  confirmado: "bg-[#1a9b60]/10 text-[#1a9b60]",
  pendente: "bg-gold/15 text-gold-dark",
  reservado: "bg-rose/10 text-rose",
};

const statusLabel: Record<string, string> = {
  confirmado: "Confirmado",
  pendente: "Aguardando",
  reservado: "Reservado",
};

type FormState = {
  id?: string;
  buyerName: string;
  phone: string;
  seats: string[];
  passengers: Record<string, { name: string; document: string }>;
  amount: string;
  amountTouched: boolean;
  paymentMethod: PaymentMethod;
  boardingPoint: string;
  notes: string;
  status: "pago" | "reservado";
  // Carnê (Pix parcelado)
  buyerDocument: string;
  buyerBirthDate: string;
  buyerAddress: string;
  buyerCep: string;
  installments: Installment[];
  installmentCount: string;
  firstDueDate: string;
  // Pagamento parcial (saldo devedor)
  payments: Payment[];
  newPaymentDate: string;
  newPaymentAmount: string;
  newPaymentNotes: string;
};

function emptyForm(): FormState {
  return {
    buyerName: "",
    phone: "",
    seats: [],
    passengers: {},
    amount: "",
    amountTouched: false,
    paymentMethod: "dinheiro",
    boardingPoint: "",
    notes: "",
    status: "pago",
    buyerDocument: "",
    buyerBirthDate: "",
    buyerAddress: "",
    buyerCep: "",
    installments: [],
    installmentCount: "5",
    firstDueDate: "",
    payments: [],
    newPaymentDate: "",
    newPaymentAmount: "",
    newPaymentNotes: "",
  };
}

export default function ManifestClient({ tripId }: { tripId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/manifest?tripId=${tripId}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [tripId]);

  useEffect(() => {
    load();
  }, [load]);

  // Atalho "Venda no Balcão" do menu: abre o modal já na chegada (?venda=1)
  useEffect(() => {
    if (searchParams.get("venda") === "1") {
      openAdd();
      router.replace(`/admin/viagens/${tripId}/passageiros`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const price = data?.trip.price ?? 0;

  // Assentos ocupados para o modal: todos menos os da venda em edição
  const modalOccupied = useMemo(() => {
    if (!data) return [];
    const editingSeats = form?.id
      ? data.manualBookings.find((b) => b.id === form.id)?.seats ?? []
      : [];
    return data.occupied.filter((s) => !editingSeats.includes(s));
  }, [data, form?.id]);

  const sortedFormSeats = useMemo(
    () => (form ? [...form.seats].sort(compareSeatIds) : []),
    [form]
  );

  function openAdd() {
    setModalError("");
    setForm(emptyForm());
  }

  function openEdit(booking: ManualBooking) {
    setModalError("");
    setForm({
      id: booking.id,
      buyerName: booking.buyerName,
      phone: booking.phone ?? "",
      seats: booking.seats,
      passengers: Object.fromEntries(
        booking.seats.map((s) => {
          const pd = booking.passengerDetails.find((p) => p.seat === s);
          return [s, { name: pd?.name ?? "", document: pd?.document ?? "" }];
        })
      ),
      amount: String(booking.amount),
      amountTouched: true,
      paymentMethod: booking.paymentMethod,
      boardingPoint: booking.boardingPoint ?? "",
      notes: booking.notes ?? "",
      status: booking.status,
      buyerDocument: booking.buyerDocument ?? "",
      buyerBirthDate: booking.buyerBirthDate ?? "",
      buyerAddress: booking.buyerAddress ?? "",
      buyerCep: booking.buyerCep ?? "",
      installments: booking.installments ?? [],
      installmentCount: String(booking.installments?.length || 5),
      firstDueDate: booking.installments?.[0]?.dueDate ?? "",
      payments: booking.payments ?? [],
      newPaymentDate: "",
      newPaymentAmount: "",
      newPaymentNotes: "",
    });
  }

  function toggleSeat(seat: string) {
    setForm((f) => {
      if (!f) return f;
      let seats: string[];
      const passengers = { ...f.passengers };
      if (f.seats.includes(seat)) {
        seats = f.seats.filter((s) => s !== seat);
        delete passengers[seat];
      } else {
        seats = [...f.seats, seat];
        passengers[seat] = {
          name: f.seats.length === 0 ? f.buyerName : "",
          document: "",
        };
      }
      const amount = f.amountTouched ? f.amount : String(price * seats.length);
      return { ...f, seats, passengers, amount };
    });
  }

  function regenerateInstallments() {
    if (!form) return;
    if (!form.firstDueDate.trim()) {
      setModalError("Informe a data do 1º vencimento antes de gerar as parcelas.");
      return;
    }
    setModalError("");
    const installments = generateInstallments(
      Number(form.amount) || 0,
      Number(form.installmentCount) || 1,
      form.firstDueDate
    );
    setForm({ ...form, installments });
  }

  function updateInstallment(id: string, patch: Partial<Installment>) {
    if (!form) return;
    setForm({
      ...form,
      installments: form.installments.map((i) =>
        i.id === id ? { ...i, ...patch } : i
      ),
    });
  }

  function removeInstallment(id: string) {
    if (!form) return;
    setForm({
      ...form,
      installments: form.installments
        .filter((i) => i.id !== id)
        .map((i, idx) => ({ ...i, number: idx + 1 })),
    });
  }

  function addInstallmentRow() {
    if (!form) return;
    const last = form.installments.at(-1);
    setForm({
      ...form,
      installments: [
        ...form.installments,
        {
          id: newId(),
          number: form.installments.length + 1,
          dueDate: last?.dueDate ?? form.firstDueDate,
          amount: last?.amount ?? 0,
          status: "pendente",
        },
      ],
    });
  }

  function addPayment() {
    if (!form) return;
    if (!form.newPaymentDate.trim() || !(Number(form.newPaymentAmount) > 0)) {
      setModalError("Informe a data e o valor do pagamento.");
      return;
    }
    setModalError("");
    setForm({
      ...form,
      payments: [
        ...form.payments,
        {
          id: newId(),
          date: form.newPaymentDate,
          amount: Number(form.newPaymentAmount),
          notes: form.newPaymentNotes.trim() || undefined,
        },
      ],
      newPaymentDate: "",
      newPaymentAmount: "",
      newPaymentNotes: "",
    });
  }

  function removePayment(id: string) {
    if (!form) return;
    setForm({ ...form, payments: form.payments.filter((p) => p.id !== id) });
  }

  async function save() {
    if (!form || !data) return;
    if (!form.buyerName.trim()) {
      setModalError("Informe o nome do comprador.");
      return;
    }
    if (form.seats.length === 0) {
      setModalError("Escolha ao menos uma poltrona.");
      return;
    }
    if (sortedFormSeats.some((s) => !form.passengers[s]?.name.trim())) {
      setModalError("Informe o nome de cada passageiro.");
      return;
    }
    if (form.paymentMethod === "parcelado" && form.installments.length === 0) {
      setModalError("Gere ao menos uma parcela para o carnê.");
      return;
    }
    setSaving(true);
    setModalError("");
    const payload = {
      tripId,
      buyerName: form.buyerName.trim(),
      phone: form.phone.trim(),
      seats: sortedFormSeats,
      passengerDetails: sortedFormSeats.map((seat) => ({
        seat,
        name: form.passengers[seat]?.name.trim() ?? "",
        document: form.passengers[seat]?.document.trim() || undefined,
      })),
      amount: Number(form.amount) || 0,
      paymentMethod: form.paymentMethod,
      boardingPoint: form.boardingPoint.trim(),
      notes: form.notes.trim(),
      status: form.status,
      buyerDocument: form.buyerDocument.trim(),
      buyerBirthDate: form.buyerBirthDate.trim(),
      buyerAddress: form.buyerAddress.trim(),
      buyerCep: form.buyerCep.trim(),
      installments: form.paymentMethod === "parcelado" ? form.installments : undefined,
      payments: form.paymentMethod === "parcial" ? form.payments : undefined,
    };
    const res = await fetch(
      form.id ? `/api/admin/manual-bookings/${form.id}` : "/api/admin/manual-bookings",
      {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    setSaving(false);
    if (res.ok) {
      setForm(null);
      load();
    } else {
      const d = await res.json().catch(() => ({}));
      setModalError(d.error ?? "Erro ao salvar.");
    }
  }

  async function remove(booking: ManualBooking) {
    if (
      !confirm(
        `Excluir a venda de ${booking.buyerName} (poltronas ${booking.seats
          .map((s) => s.split("-").pop())
          .join(", ")})?`
      )
    )
      return;
    await fetch(`/api/admin/manual-bookings/${booking.id}`, { method: "DELETE" });
    load();
  }

  function exportCsv() {
    if (!data) return;
    const header = [
      "Poltrona",
      "Passageiro",
      "Documento",
      "Telefone",
      "Origem",
      "Pagamento",
      "Valor",
      "Status",
      "Embarque",
    ];
    const lines = data.manifest.rows.map((r) =>
      [
        seatLabel(r.seat),
        r.passengerName,
        r.document ?? "",
        r.phone ?? "",
        r.origin === "online" ? "Online" : "Balcão",
        r.isManual
          ? PAYMENT_METHOD_LABELS[r.paymentMethod as PaymentMethod] ?? ""
          : r.paymentMethod ?? "Online",
        String(r.amountPerSeat.toFixed(2)).replace(".", ","),
        statusLabel[r.status],
        r.boardingPoint ?? "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(";")
    );
    const csv = "﻿" + [header.join(";"), ...lines].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lista-embarque-${data.trip.slug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function printList() {
    if (!data) return;
    const { trip, manifest } = data;
    const rowsHtml = manifest.rows
      .map(
        (r, i) => `<tr>
          <td class="c">${i + 1}</td>
          <td class="c b">${seatLabel(r.seat)}</td>
          <td>${escapeHtml(r.passengerName)}</td>
          <td>${escapeHtml(r.document ?? "")}</td>
          <td>${escapeHtml(r.phone ?? "")}</td>
          <td>${escapeHtml(r.boardingPoint ?? "")}</td>
          <td class="c">${r.origin === "online" ? "Online" : "Balcão"}</td>
          <td class="c">${statusLabel[r.status]}</td>
          <td class="sig"></td>
        </tr>`
      )
      .join("");
    const w = window.open("", "_blank", "width=900,height=1000");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8">
      <title>Lista de embarque — ${escapeHtml(trip.title)}</title>
      <style>
        * { font-family: Arial, sans-serif; }
        body { margin: 24px; color: #211d1d; }
        h1 { font-size: 18px; margin: 0 0 2px; }
        .meta { font-size: 12px; color: #555; margin-bottom: 4px; }
        .sum { font-size: 12px; margin: 8px 0 16px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #bbb; padding: 5px 7px; font-size: 11px; text-align: left; }
        th { background: #f2e9e6; }
        .c { text-align: center; }
        .b { font-weight: bold; }
        .sig { width: 130px; }
        @media print { body { margin: 10mm; } }
      </style></head><body>
      <h1>Lista de Embarque — ${escapeHtml(trip.title)}</h1>
      <div class="meta">${escapeHtml(trip.destination)} · Saída: ${escapeHtml(
      trip.date
    )}</div>
      <div class="sum">Confirmados: <b>${manifest.summary.confirmed}</b> ·
        Aguardando: ${manifest.summary.pending} ·
        Livres: ${manifest.summary.free} / ${manifest.summary.capacity} lugares</div>
      <table><thead><tr>
        <th class="c">#</th><th class="c">Polt.</th><th>Passageiro</th>
        <th>Documento</th><th>Telefone</th><th>Embarque</th>
        <th class="c">Origem</th><th class="c">Status</th><th>Assinatura</th>
      </tr></thead><tbody>${rowsHtml}</tbody></table>
      </body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  }

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-graphite/55">
        <Loader2 size={16} className="animate-spin" />
        Carregando a lista de embarque...
      </p>
    );
  }
  if (!data) return <p className="text-sm text-rose">Erro ao carregar.</p>;

  const { trip, manifest } = data;
  const s = manifest.summary;

  return (
    <div>
      <Link
        href="/admin/viagens"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-graphite/60 transition-colors hover:text-rose-dark"
      >
        <ArrowLeft size={15} />
        Voltar para viagens
      </Link>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-graphite">
            Lista de Embarque
          </h1>
          <p className="mt-1 text-sm text-graphite/55">
            {trip.title} · {trip.date} — todos os passageiros (online + balcão).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/viagens/${tripId}/financeiro`}
            className="btn-outline !px-5 !py-2.5"
          >
            <Wallet size={15} />
            Financeiro
          </Link>
          <button onClick={printList} className="btn-outline !px-5 !py-2.5">
            <Printer size={15} />
            Imprimir
          </button>
          <button onClick={exportCsv} className="btn-outline !px-5 !py-2.5">
            <Download size={15} />
            CSV
          </button>
          <button onClick={openAdd} className="btn-primary !px-5 !py-2.5">
            <Plus size={16} />
            Venda no balcão
          </button>
        </div>
      </div>

      {/* Resumo */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Confirmados" value={`${s.confirmed}`} sub={`de ${s.capacity} lugares`} />
        <SummaryCard label="Livres" value={`${s.free}`} sub={`${s.pending} aguardando · ${s.blocked} bloqueadas`} />
        <SummaryCard
          label="Recebido"
          value={formatPrice(s.total)}
          sub={`Online ${formatPrice(s.receivedOnline)} · Balcão ${formatPrice(s.receivedManual)}`}
          highlight
        />
        <SummaryCard label="A receber (reservas)" value={formatPrice(s.toReceive)} sub="Vendas marcadas como reservado" />
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-3xl bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-graphite/8 text-xs uppercase tracking-wider text-graphite/45">
                <th className="px-5 py-4 font-semibold">Polt.</th>
                <th className="px-5 py-4 font-semibold">Passageiro</th>
                <th className="px-5 py-4 font-semibold">Contato</th>
                <th className="px-5 py-4 font-semibold">Origem</th>
                <th className="px-5 py-4 font-semibold">Valor</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-graphite/6">
              {manifest.rows.map((r) => {
                const waLink =
                  r.status === "confirmado"
                    ? confirmationWhatsAppLink({
                        name: r.passengerName,
                        phone: r.phone,
                        tripTitle: trip.title,
                        tripDate: trip.date,
                        seats: [r.seat],
                        passengers: 1,
                        amount: r.amountPerSeat,
                        reference: r.bookingId,
                      })
                    : null;
                return (
                <tr key={`${r.bookingId}-${r.seat}`} className="hover:bg-blush-light/40">
                  <td className="px-5 py-3.5">
                    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg bg-rose/10 px-2 text-xs font-bold text-rose-dark">
                      {r.seat.split("-").pop()}
                    </span>
                    {r.seat.includes("-") && (
                      <span className="ml-1.5 text-[10px] text-graphite/45">
                        ôn. {r.seat.split("-")[0]}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-graphite">{r.passengerName}</p>
                    {r.document && (
                      <p className="text-xs text-graphite/50">{r.document}</p>
                    )}
                    {r.buyerName !== r.passengerName && (
                      <p className="text-[11px] text-graphite/40">
                        compra: {r.buyerName}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-graphite/70">
                    {r.phone || "—"}
                    {r.boardingPoint && (
                      <p className="text-[11px] text-graphite/45">{r.boardingPoint}</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        r.origin === "online"
                          ? "bg-[#4285F4]/10 text-[#4285F4]"
                          : "bg-gold/10 text-gold-dark"
                      }`}
                    >
                      {r.origin === "online" ? <Globe size={11} /> : <Store size={11} />}
                      {r.origin === "online" ? "Online" : "Balcão"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-graphite/70">
                    {formatPrice(r.amountPerSeat)}
                    {r.isManual && (
                      <p className="text-[11px] text-graphite/45">
                        {PAYMENT_METHOD_LABELS[r.paymentMethod as PaymentMethod]}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${statusStyle[r.status]}`}
                    >
                      {statusLabel[r.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      {waLink && (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Enviar confirmação por WhatsApp"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#25D366] hover:bg-[#25D366]/10"
                        >
                          <MessageCircle size={14} />
                        </a>
                      )}
                      {r.isManual ? (
                        <>
                          {r.paymentMethod === "parcelado" && (
                            <Link
                              href="/admin/parcelamentos"
                              title="Ver carnê em Parcelamentos"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-gold-dark hover:bg-gold/10"
                            >
                              <CreditCard size={14} />
                            </Link>
                          )}
                          <button
                            onClick={() => {
                              const b = data.manualBookings.find((x) => x.id === r.bookingId);
                              if (b) openEdit(b);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-graphite/45 hover:bg-blush hover:text-rose-dark"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => {
                              const b = data.manualBookings.find((x) => x.id === r.bookingId);
                              if (b) remove(b);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-graphite/45 hover:bg-rose/10 hover:text-rose"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      ) : (
                        !waLink && (
                          <span className="text-[11px] text-graphite/35">site</span>
                        )
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
              {manifest.rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-graphite/45">
                    Nenhum passageiro ainda. Adicione as vendas no balcão ou
                    aguarde as reservas online.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de venda no balcão */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-graphite/60 p-2 backdrop-blur-sm sm:p-4">
          <div className="my-4 w-full max-w-3xl rounded-3xl bg-white p-5 shadow-lifted sm:my-8 sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-graphite">
                {form.id ? "Editar venda" : "Nova venda no balcão"}
              </h2>
              <button
                onClick={() => setForm(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-graphite/45 hover:bg-blush"
              >
                <X size={17} />
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Nome do comprador *</label>
                  <input
                    className={inputClass}
                    value={form.buyerName}
                    onChange={(e) => setForm({ ...form, buyerName: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass}>Telefone</label>
                  <PhoneInput
                    className={inputClass}
                    value={form.phone}
                    onChange={(v) => setForm({ ...form, phone: v })}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Poltronas ({form.seats.length} selecionada
                  {form.seats.length === 1 ? "" : "s"})
                </label>
                <div className="overflow-x-auto rounded-2xl border border-graphite/10 bg-blush-light/40 p-4">
                  <BusSeatMap
                    layout={data.layout}
                    active={form.seats}
                    occupied={modalOccupied}
                    onToggle={toggleSeat}
                    variant="admin"
                  />
                </div>
              </div>

              {sortedFormSeats.length > 0 && (
                <div className="space-y-3">
                  <label className={labelClass}>Passageiros</label>
                  {sortedFormSeats.map((seat) => (
                    <div
                      key={seat}
                      className="grid gap-3 rounded-xl border border-graphite/10 p-3 sm:grid-cols-[auto_1fr_1fr]"
                    >
                      <span className="flex h-10 items-center gap-1.5 text-xs font-semibold text-graphite/60">
                        <span className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-rose px-2 text-white">
                          {seat.split("-").pop()}
                        </span>
                        {seat.includes("-") && `ôn.${seat.split("-")[0]}`}
                      </span>
                      <input
                        className={inputClass}
                        placeholder="Nome do passageiro"
                        value={form.passengers[seat]?.name ?? ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            passengers: {
                              ...form.passengers,
                              [seat]: {
                                name: e.target.value,
                                document: form.passengers[seat]?.document ?? "",
                              },
                            },
                          })
                        }
                      />
                      <input
                        className={inputClass}
                        placeholder="Documento (opcional)"
                        value={form.passengers[seat]?.document ?? ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            passengers: {
                              ...form.passengers,
                              [seat]: {
                                name: form.passengers[seat]?.name ?? "",
                                document: e.target.value,
                              },
                            },
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelClass}>Valor total</label>
                  <CurrencyInput
                    className={inputClass}
                    value={Number(form.amount) || 0}
                    onChange={(v) =>
                      setForm({ ...form, amount: String(v), amountTouched: true })
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>Forma de pagamento</label>
                  <select
                    className={inputClass}
                    value={form.paymentMethod}
                    onChange={(e) =>
                      setForm({ ...form, paymentMethod: e.target.value as PaymentMethod })
                    }
                  >
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                {form.paymentMethod !== "parcelado" && form.paymentMethod !== "parcial" && (
                  <div>
                    <label className={labelClass}>Situação</label>
                    <select
                      className={inputClass}
                      value={form.status}
                      onChange={(e) =>
                        setForm({ ...form, status: e.target.value as "pago" | "reservado" })
                      }
                    >
                      <option value="pago">Pago</option>
                      <option value="reservado">Reservado (sinal)</option>
                    </select>
                  </div>
                )}
              </div>

              {form.paymentMethod === "parcelado" && (
                <div className="space-y-5 rounded-2xl border border-gold/25 bg-gold/8 p-5">
                  <p className="flex items-center gap-2 text-sm font-bold text-gold-dark">
                    <CreditCard size={16} />
                    Carnê — Pix Parcelado
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>CPF do titular</label>
                      <input
                        className={inputClass}
                        placeholder="000.000.000-00"
                        value={form.buyerDocument}
                        onChange={(e) => setForm({ ...form, buyerDocument: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Nascimento</label>
                      <DateField
                        className={inputClass}
                        value={form.buyerBirthDate}
                        onChange={(v) => setForm({ ...form, buyerBirthDate: v })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                    <div>
                      <label className={labelClass}>Endereço</label>
                      <input
                        className={inputClass}
                        placeholder="Rua, número, bairro, cidade"
                        value={form.buyerAddress}
                        onChange={(e) => setForm({ ...form, buyerAddress: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>CEP</label>
                      <input
                        className={`${inputClass} sm:w-32`}
                        placeholder="00000-000"
                        value={form.buyerCep}
                        onChange={(e) => setForm({ ...form, buyerCep: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-[auto_auto_1fr]">
                    <div>
                      <label className={labelClass}>Nº de parcelas</label>
                      <input
                        type="number"
                        min={1}
                        max={24}
                        className={`${inputClass} sm:w-28`}
                        value={form.installmentCount}
                        onChange={(e) =>
                          setForm({ ...form, installmentCount: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className={labelClass}>1º vencimento</label>
                      <DateField
                        className={inputClass}
                        value={form.firstDueDate}
                        onChange={(v) => setForm({ ...form, firstDueDate: v })}
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={regenerateInstallments}
                        className="btn-outline w-full !py-2.5"
                      >
                        <Wand2 size={14} />
                        {form.installments.length ? "Gerar novamente" : "Gerar parcelas"}
                      </button>
                    </div>
                  </div>

                  {form.installments.length > 0 && (
                    <div className="space-y-2">
                      <label className={labelClass}>
                        Parcelas ({formatPrice(form.installments.reduce((s, i) => s + i.amount, 0))} no total)
                      </label>
                      {form.installments.map((inst) => (
                        <div
                          key={inst.id}
                          className="grid grid-cols-2 items-center gap-3 rounded-xl border border-graphite/10 bg-white p-3 sm:grid-cols-[auto_1fr_1fr_auto]"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/20 text-xs font-bold text-gold-dark">
                            {inst.number}
                          </span>
                          <DateField
                            className={inputClass}
                            value={inst.dueDate}
                            onChange={(v) => updateInstallment(inst.id, { dueDate: v })}
                          />
                          <CurrencyInput
                            className={inputClass}
                            value={inst.amount}
                            onChange={(v) => updateInstallment(inst.id, { amount: v })}
                          />
                          <button
                            type="button"
                            onClick={() => removeInstallment(inst.id)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-graphite/40 hover:bg-rose/10 hover:text-rose"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addInstallmentRow}
                        className="flex items-center gap-1.5 text-xs font-semibold text-rose hover:text-rose-dark"
                      >
                        <Plus size={13} />
                        Adicionar parcela avulsa
                      </button>
                    </div>
                  )}

                  <p className="text-[11px] text-graphite/50">
                    Depois de criada, dê baixa em cada parcela (conforme o
                    comprovante chegar) na tela{" "}
                    <Link href="/admin/parcelamentos" className="font-semibold text-rose hover:text-rose-dark">
                      Admin → Parcelamentos
                    </Link>
                    .
                  </p>
                </div>
              )}

              {form.paymentMethod === "parcial" && (
                <div className="space-y-4 rounded-2xl border border-[#4285F4]/25 bg-[#4285F4]/8 p-5">
                  <p className="flex items-center gap-2 text-sm font-bold text-[#2f5fbf]">
                    <Wallet size={16} />
                    Pagamento Parcial — Saldo Devedor
                  </p>
                  <p className="text-[11px] text-graphite/50">
                    Sem parcelas fixas nem vencimento — vá lançando os valores
                    conforme forem chegando (edite essa venda de novo quando
                    quiser abater mais). A situação vira "Pago" sozinha
                    quando o saldo devedor chegar a zero.
                  </p>

                  {(() => {
                    const summary = summarizePayments(
                      Number(form.amount) || 0,
                      form.payments
                    );
                    return (
                      <div className="grid grid-cols-3 gap-3 rounded-xl border border-graphite/10 bg-white p-3 text-center">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-graphite/45">
                            Total
                          </p>
                          <p className="text-sm font-bold text-graphite">
                            {formatPrice(summary.totalAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-graphite/45">
                            Pago
                          </p>
                          <p className="text-sm font-bold text-[#1a9b60]">
                            {formatPrice(summary.paidAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-graphite/45">
                            Saldo devedor
                          </p>
                          <p className="text-sm font-bold text-rose">
                            {formatPrice(summary.remainingAmount)}
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {form.payments.length > 0 && (
                    <div className="space-y-2">
                      <label className={labelClass}>Pagamentos recebidos</label>
                      {form.payments.map((p) => (
                        <div
                          key={p.id}
                          className="grid grid-cols-2 items-center gap-3 rounded-xl border border-graphite/10 bg-white p-3 sm:grid-cols-[auto_auto_1fr_auto]"
                        >
                          <span className="text-xs font-semibold text-graphite/60">
                            {p.date}
                          </span>
                          <span className="text-sm font-semibold text-graphite">
                            {formatPrice(p.amount)}
                          </span>
                          <span className="truncate text-xs text-graphite/45">
                            {p.notes}
                          </span>
                          <button
                            type="button"
                            onClick={() => removePayment(p.id)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-graphite/40 hover:bg-rose/10 hover:text-rose"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-[auto_auto_1fr_auto]">
                    <div>
                      <label className={labelClass}>Data</label>
                      <DateField
                        className={`${inputClass} sm:w-32`}
                        value={form.newPaymentDate}
                        onChange={(v) => setForm({ ...form, newPaymentDate: v })}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Valor</label>
                      <CurrencyInput
                        className={`${inputClass} sm:w-32`}
                        value={Number(form.newPaymentAmount) || 0}
                        onChange={(v) => setForm({ ...form, newPaymentAmount: String(v) })}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Observação (opcional)</label>
                      <input
                        className={inputClass}
                        placeholder="Ex.: Pix recebido"
                        value={form.newPaymentNotes}
                        onChange={(e) => setForm({ ...form, newPaymentNotes: e.target.value })}
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={addPayment}
                        className="btn-outline w-full !py-2.5"
                      >
                        <Plus size={14} />
                        Adicionar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Ponto de embarque</label>
                  <input
                    className={inputClass}
                    placeholder="Ex.: Palhoça, Terminal"
                    value={form.boardingPoint}
                    onChange={(e) => setForm({ ...form, boardingPoint: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass}>Observações</label>
                  <input
                    className={inputClass}
                    placeholder="Ex.: criança, cadeirante..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
              </div>

              {modalError && <p className="text-xs text-rose">{modalError}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setForm(null)}
                  className="rounded-full px-6 py-3 text-sm font-semibold text-graphite/55 hover:text-graphite"
                >
                  Cancelar
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="btn-primary disabled:opacity-60"
                >
                  {saving && <Loader2 size={15} className="animate-spin" />}
                  {form.id ? "Salvar alterações" : "Registrar venda"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-soft">
      <p className="text-xs uppercase tracking-wider text-graphite/50">{label}</p>
      <p
        className={`mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold ${
          highlight ? "text-[#1a9b60]" : "text-graphite"
        }`}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-[11px] text-graphite/45">{sub}</p>}
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
