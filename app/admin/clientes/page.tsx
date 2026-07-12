import { getCustomers, getReservations } from "@/lib/db";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

type CustomerRow = {
  name: string;
  email: string;
  phone?: string;
  picture?: string;
  hasGoogle: boolean;
  reservationsCount: number;
  approvedCount: number;
  totalSpent: number;
  lastActivity: string;
};

export default async function AdminCustomersPage() {
  const [customers, reservations] = await Promise.all([
    getCustomers(),
    getReservations(),
  ]);

  // Une a base de clientes com os compradores das reservas (por e-mail)
  const rows = new Map<string, CustomerRow>();

  for (const c of customers) {
    rows.set(c.email, {
      name: c.name,
      email: c.email,
      phone: c.phone,
      picture: c.picture,
      hasGoogle: Boolean(c.googleId),
      reservationsCount: 0,
      approvedCount: 0,
      totalSpent: 0,
      lastActivity: c.updatedAt,
    });
  }

  for (const r of reservations) {
    const email = r.email.toLowerCase();
    const row = rows.get(email) ?? {
      name: r.name,
      email,
      phone: r.phone || undefined,
      picture: undefined,
      hasGoogle: false,
      reservationsCount: 0,
      approvedCount: 0,
      totalSpent: 0,
      lastActivity: r.createdAt,
    };
    row.reservationsCount += 1;
    if (r.status === "approved") {
      row.approvedCount += 1;
      row.totalSpent += r.amount;
    }
    if (r.createdAt > row.lastActivity) row.lastActivity = r.createdAt;
    if (!row.phone && r.phone) row.phone = r.phone;
    rows.set(email, row);
  }

  const list = [...rows.values()].sort((a, b) =>
    b.lastActivity.localeCompare(a.lastActivity)
  );

  const totalRevenue = list.reduce((sum, c) => sum + c.totalSpent, 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-graphite">
          Clientes
        </h1>
        <p className="mt-1 text-sm text-graphite/55">
          Base unificada: quem comprou pelo site e quem entrou com Google.
        </p>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-soft">
          <p className="text-xs uppercase tracking-wider text-graphite/50">
            Clientes na base
          </p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-graphite">
            {list.length}
          </p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-soft">
          <p className="text-xs uppercase tracking-wider text-graphite/50">
            Com login Google
          </p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-graphite">
            {list.filter((c) => c.hasGoogle).length}
          </p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-soft">
          <p className="text-xs uppercase tracking-wider text-graphite/50">
            Receita de clientes
          </p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-[#1a9b60]">
            {formatPrice(totalRevenue)}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-graphite/8 text-xs uppercase tracking-wider text-graphite/45">
                <th className="px-6 py-4 font-semibold">Cliente</th>
                <th className="px-6 py-4 font-semibold">Contato</th>
                <th className="px-6 py-4 font-semibold">Reservas</th>
                <th className="px-6 py-4 font-semibold">Total gasto</th>
                <th className="px-6 py-4 font-semibold">Origem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-graphite/6">
              {list.map((c) => (
                <tr key={c.email} className="transition-colors hover:bg-blush-light/40">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {c.picture ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.picture}
                          alt=""
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blush text-xs font-bold text-rose-dark">
                          {c.name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <p className="font-semibold text-graphite">{c.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-graphite/70">{c.email}</p>
                    {c.phone && (
                      <p className="text-xs text-graphite/50">{c.phone}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-graphite">
                      {c.approvedCount}
                    </span>
                    <span className="text-graphite/45">
                      {" "}
                      / {c.reservationsCount}
                    </span>
                    <p className="text-[11px] text-graphite/45">
                      confirmadas / total
                    </p>
                  </td>
                  <td className="px-6 py-4 font-semibold text-graphite">
                    {formatPrice(c.totalSpent)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                        c.hasGoogle
                          ? "bg-[#4285F4]/10 text-[#4285F4]"
                          : "bg-gold/10 text-gold-dark"
                      }`}
                    >
                      {c.hasGoogle ? "Google" : "Compra no site"}
                    </span>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-graphite/45">
                    Nenhum cliente ainda. Cada compra ou login com Google
                    alimenta esta base automaticamente.
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
