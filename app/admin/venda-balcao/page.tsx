"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Store } from "lucide-react";
import type { Trip } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export default function VendaBalcaoPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/trips")
      .then((res) => res.json())
      .then((data: Trip[]) => {
        setTrips(
          [...data].sort((a, b) => a.date.localeCompare(b.date))
        );
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-graphite">
          Venda no Balcão
        </h1>
        <p className="mt-1 text-sm text-graphite/55">
          Escolha a viagem para registrar uma venda presencial.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-graphite/50">Carregando...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <Link
              key={trip.id}
              href={`/admin/viagens/${trip.id}/passageiros?venda=1`}
              className="card-hover group rounded-3xl bg-white p-6 shadow-soft"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blush text-rose-dark transition-colors group-hover:bg-rose group-hover:text-white">
                  <Store size={18} />
                </span>
                <ArrowRight
                  size={17}
                  className="text-graphite/25 transition-all group-hover:translate-x-1 group-hover:text-rose"
                />
              </div>
              <p className="mt-4 font-semibold text-graphite">{trip.title}</p>
              <p className="mt-1 text-xs text-graphite/50">
                {trip.destination} · {trip.date}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                    trip.spotsLeft <= 12
                      ? "bg-rose/10 text-rose"
                      : "bg-gold/10 text-gold-dark"
                  }`}
                >
                  {trip.spotsLeft} vagas
                </span>
                <span className="text-xs text-graphite/50">
                  {formatPrice(trip.price)}
                </span>
              </div>
            </Link>
          ))}
          {trips.length === 0 && (
            <p className="col-span-full rounded-3xl bg-white p-10 text-center text-sm text-graphite/45 shadow-soft">
              Nenhuma viagem cadastrada ainda.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
