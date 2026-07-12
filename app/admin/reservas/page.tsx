import { getReservations } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { seatLabel } from "@/lib/bus";
import { confirmationWhatsAppLink } from "@/lib/confirmation-message";
import { MessageCircle } from "lucide-react";

export const dynamic = "force-dynamic";

const statusStyle: Record<string, string> = {
  approved: "bg-[#1a9b60]/10 text-[#1a9b60]",
  pending: "bg-gold/15 text-gold-dark",
  rejected: "bg-rose/10 text-rose",
  cancelled: "bg-graphite/10 text-graphite/50",
};

const statusLabel: Record<string, string> = {
  approved: "Aprovada",
  pending: "Pendente",
  rejected: "Recusada",
  cancelled: "Cancelada",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function AdminReservationsPage() {
  const reservations = (await getReservations()).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );

  const approved = reservations.filter((r) => r.status === "approved");
  const totalApproved = approved.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-graphite">
          Reservas Online
        </h1>
        <p className="mt-1 text-sm text-graphite/55">
          Pagamentos realizados pelo site via InfinitePay. Reservas aprovadas
          descontam as vagas da viagem automaticamente.
        </p>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-soft">
          <p className="text-xs uppercase tracking-wider text-graphite/50">
            Reservas aprovadas
          </p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-graphite">
            {approved.length}
          </p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-soft">
          <p className="text-xs uppercase tracking-wider text-graphite/50">
            Passageiros confirmados
          </p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-graphite">
            {approved.reduce((sum, r) => sum + r.passengers, 0)}
          </p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-soft">
          <p className="text-xs uppercase tracking-wider text-graphite/50">
            Total recebido
          </p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-[#1a9b60]">
            {formatPrice(totalApproved)}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-graphite/8 text-xs uppercase tracking-wider text-graphite/45">
                <th className="px-6 py-4 font-semibold">Cliente</th>
                <th className="px-6 py-4 font-semibold">Viagem</th>
                <th className="px-6 py-4 font-semibold">Pass.</th>
                <th className="px-6 py-4 font-semibold">Valor</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Data</th>
                <th className="px-6 py-4 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-graphite/6">
              {reservations.map((r) => {
                const waLink =
                  r.status === "approved"
                    ? confirmationWhatsAppLink({
                        name: r.name,
                        phone: r.phone,
                        tripTitle: r.tripTitle,
                        tripDate: r.tripDate,
                        seats: r.seats,
                        passengers: r.passengers,
                        amount: r.amount,
                        reference: r.id,
                      })
                    : null;
                return (
                <tr key={r.id} className="transition-colors hover:bg-blush-light/40">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-graphite">{r.name}</p>
                    <p className="text-xs text-graphite/50">{r.email}</p>
                    {r.phone && (
                      <p className="text-xs text-graphite/50">{r.phone}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-graphite/80">{r.tripTitle}</p>
                    <p className="text-xs text-graphite/50">{r.tripDate}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-graphite/70">
                      {r.passengers}{" "}
                      {r.passengers === 1 ? "pass." : "pass."}
                    </p>
                    {r.seats?.length ? (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {r.seats.map((s) => (
                          <span
                            key={s}
                            className="rounded-md bg-rose/10 px-1.5 py-0.5 text-[10px] font-bold text-rose-dark"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {r.passengerDetails?.length ? (
                      <div className="mt-1.5 space-y-0.5">
                        {r.passengerDetails.map((p) => (
                          <p key={p.seat} className="text-[11px] text-graphite/50">
                            <span className="font-semibold text-graphite/70">
                              {seatLabel(p.seat)}
                            </span>{" "}
                            {p.name}
                            {p.document ? ` · ${p.document}` : ""}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-6 py-4 font-semibold text-graphite">
                    {formatPrice(r.amount)}
                    {r.paymentMethod && (
                      <p className="text-[11px] font-normal text-graphite/45">
                        {r.paymentMethod}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                        statusStyle[r.status] ?? statusStyle.pending
                      }`}
                    >
                      {statusLabel[r.status] ?? r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-graphite/55">
                    {formatDate(r.createdAt)}
                    {r.transactionId && (
                      <p className="text-[11px] text-graphite/40">
                        NSU {r.transactionId}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {waLink && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Enviar confirmação por WhatsApp"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[#25D366] transition-colors hover:bg-[#25D366]/10"
                      >
                        <MessageCircle size={16} />
                      </a>
                    )}
                  </td>
                </tr>
                );
              })}
              {reservations.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-graphite/45">
                    Nenhuma reserva online ainda. Assim que um cliente pagar
                    pelo site, ela aparece aqui.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
