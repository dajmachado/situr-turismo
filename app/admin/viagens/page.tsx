"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, ExternalLink, Users, Wallet } from "lucide-react";
import type { Trip } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export default function AdminTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/admin/trips");
    setTrips(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(trip: Trip) {
    if (!confirm(`Excluir a viagem "${trip.title}"? Essa ação não pode ser desfeita.`))
      return;
    await fetch(`/api/admin/trips/${trip.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-graphite">
            Viagens
          </h1>
          <p className="mt-1 text-sm text-graphite/55">
            Crie e edite as excursões exibidas no site.
          </p>
        </div>
        <Link href="/admin/viagens/nova" className="btn-primary">
          <Plus size={16} />
          Nova viagem
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-graphite/50">Carregando...</p>
      ) : (
        <div className="overflow-hidden rounded-3xl bg-white shadow-soft">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-graphite/8 text-xs uppercase tracking-wider text-graphite/45">
                <th className="px-6 py-4 font-semibold">Viagem</th>
                <th className="px-6 py-4 font-semibold">Data</th>
                <th className="px-6 py-4 font-semibold">Preço</th>
                <th className="px-6 py-4 font-semibold">Vagas</th>
                <th className="px-6 py-4 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-graphite/6">
              {trips.map((trip) => (
                <tr key={trip.id} className="transition-colors hover:bg-blush-light/40">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-graphite">{trip.title}</p>
                    <p className="text-xs text-graphite/50">{trip.destination}</p>
                  </td>
                  <td className="px-6 py-4 text-graphite/70">{trip.date}</td>
                  <td className="px-6 py-4 text-graphite/70">
                    {formatPrice(trip.price)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                        trip.spotsLeft <= 12
                          ? "bg-rose/10 text-rose"
                          : "bg-gold/10 text-gold-dark"
                      }`}
                    >
                      {trip.spotsLeft} / {trip.spotsTotal}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/viagens/${trip.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Ver no site"
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-graphite/45 transition-colors hover:bg-blush hover:text-rose-dark"
                      >
                        <ExternalLink size={15} />
                      </a>
                      <Link
                        href={`/admin/viagens/${trip.id}/passageiros`}
                        title="Lista de embarque"
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-graphite/45 transition-colors hover:bg-blush hover:text-rose-dark"
                      >
                        <Users size={15} />
                      </Link>
                      <Link
                        href={`/admin/viagens/${trip.id}/financeiro`}
                        title="Financeiro"
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-graphite/45 transition-colors hover:bg-blush hover:text-rose-dark"
                      >
                        <Wallet size={15} />
                      </Link>
                      <Link
                        href={`/admin/viagens/${trip.id}`}
                        title="Editar"
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-graphite/45 transition-colors hover:bg-blush hover:text-rose-dark"
                      >
                        <Pencil size={15} />
                      </Link>
                      <button
                        onClick={() => remove(trip)}
                        title="Excluir"
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-graphite/45 transition-colors hover:bg-rose/10 hover:text-rose"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {trips.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-graphite/45">
                    Nenhuma viagem cadastrada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
