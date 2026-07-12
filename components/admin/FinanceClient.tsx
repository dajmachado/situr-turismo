"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  Users,
} from "lucide-react";
import type { Expense, ExpenseCategory } from "@/lib/types";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/types";
import type { ManifestSummary } from "@/lib/manifest";
import { formatPrice } from "@/lib/utils";
import CurrencyInput from "@/components/CurrencyInput";
import DateField from "./DateField";

const inputClass =
  "w-full rounded-xl border border-graphite/15 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rose";
const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-graphite/55";

type TripInfo = {
  id: string;
  title: string;
  date: string;
  destination: string;
  slug: string;
  price: number;
};

type FormState = {
  id?: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  notes: string;
};

function emptyForm(): FormState {
  return { description: "", category: "outros", amount: 0, date: "", notes: "" };
}

function SummaryCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tone?: "positive" | "negative" | "neutral";
}) {
  const color =
    tone === "positive"
      ? "text-[#1a9b60]"
      : tone === "negative"
        ? "text-rose"
        : "text-graphite";
  return (
    <div className="rounded-3xl bg-white p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-graphite/50">{label}</p>
        <Icon size={16} className="text-graphite/30" />
      </div>
      <p className={`mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold ${color}`}>
        {value}
      </p>
      {sub && <p className="mt-1 text-[11px] text-graphite/45">{sub}</p>}
    </div>
  );
}

export default function FinanceClient({ tripId }: { tripId: string }) {
  const [trip, setTrip] = useState<TripInfo | null>(null);
  const [summary, setSummary] = useState<ManifestSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  const load = useCallback(async () => {
    const [manifestRes, expensesRes] = await Promise.all([
      fetch(`/api/admin/manifest?tripId=${tripId}`),
      fetch(`/api/admin/expenses?tripId=${tripId}`),
    ]);
    if (manifestRes.ok) {
      const data = await manifestRes.json();
      setTrip(data.trip);
      setSummary(data.manifest.summary);
    }
    if (expensesRes.ok) {
      setExpenses(await expensesRes.json());
    }
    setLoading(false);
  }, [tripId]);

  useEffect(() => {
    load();
  }, [load]);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const revenue = summary?.total ?? 0;
  const profit = revenue - totalExpenses;

  function openAdd() {
    setModalError("");
    setForm(emptyForm());
  }

  function openEdit(expense: Expense) {
    setModalError("");
    setForm({
      id: expense.id,
      description: expense.description,
      category: expense.category,
      amount: expense.amount,
      date: expense.date ?? "",
      notes: expense.notes ?? "",
    });
  }

  async function save() {
    if (!form) return;
    if (!form.description.trim()) {
      setModalError("Informe a descrição da despesa.");
      return;
    }
    setSaving(true);
    setModalError("");
    const payload = {
      tripId,
      description: form.description.trim(),
      category: form.category,
      amount: form.amount,
      date: form.date.trim(),
      notes: form.notes.trim(),
    };
    const res = await fetch(
      form.id ? `/api/admin/expenses/${form.id}` : "/api/admin/expenses",
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

  async function remove(expense: Expense) {
    if (!confirm(`Excluir a despesa "${expense.description}"?`)) return;
    await fetch(`/api/admin/expenses/${expense.id}`, { method: "DELETE" });
    load();
  }

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-graphite/55">
        <Loader2 size={16} className="animate-spin" />
        Carregando o financeiro da viagem...
      </p>
    );
  }
  if (!trip) return <p className="text-sm text-rose">Erro ao carregar.</p>;

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
            Financeiro da Viagem
          </h1>
          <p className="mt-1 text-sm text-graphite/55">
            {trip.title} · {trip.date} — receita, despesas e lucro.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/viagens/${tripId}/passageiros`}
            className="btn-outline !px-5 !py-2.5"
          >
            <Users size={15} />
            Lista de embarque
          </Link>
          <button onClick={openAdd} className="btn-primary !px-5 !py-2.5">
            <Plus size={16} />
            Nova despesa
          </button>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Receita"
          value={formatPrice(revenue)}
          sub={`Online ${formatPrice(summary?.receivedOnline ?? 0)} · Balcão ${formatPrice(summary?.receivedManual ?? 0)}`}
          icon={TrendingUp}
          tone="positive"
        />
        <SummaryCard
          label="Despesas"
          value={formatPrice(totalExpenses)}
          sub={`${expenses.length} ${expenses.length === 1 ? "lançamento" : "lançamentos"}`}
          icon={Receipt}
          tone="negative"
        />
        <SummaryCard
          label="Lucro"
          value={formatPrice(profit)}
          sub={revenue > 0 ? `Margem de ${Math.round((profit / revenue) * 100)}%` : undefined}
          icon={Wallet}
          tone={profit >= 0 ? "positive" : "negative"}
        />
        <SummaryCard
          label="A receber"
          value={formatPrice(summary?.toReceive ?? 0)}
          sub="Vendas reservadas (sinal)"
          icon={TrendingDown}
        />
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-graphite/8 text-xs uppercase tracking-wider text-graphite/45">
                <th className="px-6 py-4 font-semibold">Descrição</th>
                <th className="px-6 py-4 font-semibold">Categoria</th>
                <th className="px-6 py-4 font-semibold">Data</th>
                <th className="px-6 py-4 font-semibold">Valor</th>
                <th className="px-6 py-4 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-graphite/6">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-blush-light/40">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-graphite">{e.description}</p>
                    {e.notes && <p className="text-xs text-graphite/50">{e.notes}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-blush px-2.5 py-1 text-[11px] font-semibold text-rose-dark">
                      {EXPENSE_CATEGORY_LABELS[e.category]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-graphite/60">{e.date || "—"}</td>
                  <td className="px-6 py-4 font-semibold text-graphite">
                    {formatPrice(e.amount)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEdit(e)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-graphite/45 hover:bg-blush hover:text-rose-dark"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => remove(e)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-graphite/45 hover:bg-rose/10 hover:text-rose"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-graphite/45">
                    Nenhuma despesa lançada ainda. Adicione custos como ônibus,
                    hospedagem, ingressos e guia para apurar o lucro real.
                  </td>
                </tr>
              )}
            </tbody>
            {expenses.length > 0 && (
              <tfoot>
                <tr className="border-t border-graphite/8 bg-blush-light/40">
                  <td colSpan={3} className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-graphite/55">
                    Total de despesas
                  </td>
                  <td colSpan={2} className="px-6 py-3.5 font-semibold text-graphite">
                    {formatPrice(totalExpenses)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Modal de despesa */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-graphite/60 p-2 backdrop-blur-sm sm:p-4">
          <div className="my-4 w-full max-w-lg rounded-3xl bg-white p-5 shadow-lifted sm:my-8 sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-graphite">
                {form.id ? "Editar despesa" : "Nova despesa"}
              </h2>
              <button
                onClick={() => setForm(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-graphite/45 hover:bg-blush"
              >
                <X size={17} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className={labelClass}>Descrição *</label>
                <input
                  className={inputClass}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Ex.: Aluguel do ônibus, hospedagem 2 noites..."
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Categoria</label>
                  <select
                    className={inputClass}
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value as ExpenseCategory })
                    }
                  >
                    {Object.entries(EXPENSE_CATEGORY_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Valor</label>
                  <CurrencyInput
                    className={inputClass}
                    value={form.amount}
                    onChange={(v) => setForm({ ...form, amount: v })}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Data (opcional)</label>
                <DateField
                  className={inputClass}
                  value={form.date}
                  onChange={(v) => setForm({ ...form, date: v })}
                />
              </div>
              <div>
                <label className={labelClass}>Observações</label>
                <input
                  className={inputClass}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Opcional"
                />
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
                  {form.id ? "Salvar alterações" : "Adicionar despesa"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
