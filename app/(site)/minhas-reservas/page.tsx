import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { Calendar, Users, ArrowRight } from "lucide-react";
import { getSessionCustomer, SESSION_COOKIE } from "@/lib/auth";
import { getReservations } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import LoginPrompt from "@/components/LoginPrompt";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Minhas Reservas",
  robots: { index: false, follow: false },
};

const statusStyle: Record<string, string> = {
  approved: "bg-[#1a9b60]/10 text-[#1a9b60]",
  pending: "bg-gold/15 text-gold-dark",
  rejected: "bg-rose/10 text-rose",
  cancelled: "bg-graphite/10 text-graphite/50",
};

const statusLabel: Record<string, string> = {
  approved: "Confirmada",
  pending: "Aguardando pagamento",
  rejected: "Pagamento recusado",
  cancelled: "Cancelada",
};

export default async function MyReservationsPage() {
  const cookieStore = await cookies();
  const customer = await getSessionCustomer(
    cookieStore.get(SESSION_COOKIE)?.value
  );

  if (!customer) {
    return (
      <>
        <PageHeader
          label="Área do viajante"
          title="Minhas Reservas"
          subtitle="Entre com sua conta Google para acompanhar suas reservas."
        />
        <section className="container-site max-w-lg py-16">
          <LoginPrompt />
        </section>
      </>
    );
  }

  const reservations = (await getReservations())
    .filter((r) => r.email.toLowerCase() === customer.email)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <PageHeader
        label="Área do viajante"
        title={`Olá, ${customer.name.split(" ")[0]}!`}
        subtitle="Acompanhe aqui as suas reservas com a SITUR."
      />
      <section className="container-site max-w-3xl py-16">
        {reservations.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow-soft">
            <p className="text-graphite/60">
              Você ainda não tem reservas. Que tal escolher seu próximo
              destino?
            </p>
            <Link href="/viagens" className="btn-primary mt-6">
              Ver próximas viagens
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {reservations.map((r) => (
              <div
                key={r.id}
                className="card-hover rounded-3xl bg-white p-7 shadow-soft"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-graphite">
                      {r.tripTitle}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] text-graphite/60">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-gold-dark" />
                        {r.tripDate}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users size={13} className="text-gold-dark" />
                        {r.passengers}{" "}
                        {r.passengers === 1 ? "passageiro" : "passageiros"}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3.5 py-1.5 text-[11px] font-semibold ${
                      statusStyle[r.status] ?? statusStyle.pending
                    }`}
                  >
                    {statusLabel[r.status] ?? r.status}
                  </span>
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-graphite/8 pt-4">
                  <p className="text-sm text-graphite/55">
                    Reserva{" "}
                    <span className="font-semibold text-graphite">{r.id}</span>{" "}
                    · {formatPrice(r.amount)}
                  </p>
                  <Link
                    href={`/viagens/${r.tripSlug}`}
                    className="flex items-center gap-1.5 text-sm font-semibold text-rose transition-colors hover:text-rose-dark"
                  >
                    Ver viagem
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
