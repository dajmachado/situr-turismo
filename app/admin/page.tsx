import Link from "next/link";
import { Bus, GalleryHorizontal, Images, Plus, ArrowRight, Store } from "lucide-react";
import { getTripsWithLiveSpots, getBanners, getGallery } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [trips, banners, gallery] = await Promise.all([
    getTripsWithLiveSpots(),
    getBanners(),
    getGallery(),
  ]);

  const cards = [
    {
      href: "/admin/viagens",
      icon: Bus,
      label: "Viagens cadastradas",
      value: trips.length,
    },
    {
      href: "/admin/banners",
      icon: GalleryHorizontal,
      label: "Banners no carrossel",
      value: banners.length,
    },
    {
      href: "/admin/galeria",
      icon: Images,
      label: "Fotos na galeria",
      value: gallery.length,
    },
  ];

  return (
    <div>
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-graphite">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-graphite/55">
            Gerencie viagens, banners e a galeria do site.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/venda-balcao" className="btn-outline">
            <Store size={16} />
            Venda no Balcão
          </Link>
          <Link href="/admin/viagens/nova" className="btn-primary">
            <Plus size={16} />
            Nova viagem
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="card-hover group rounded-3xl bg-white p-7 shadow-soft"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blush text-rose-dark transition-colors group-hover:bg-rose group-hover:text-white">
                <card.icon size={20} />
              </span>
              <ArrowRight
                size={17}
                className="text-graphite/25 transition-all group-hover:translate-x-1 group-hover:text-rose"
              />
            </div>
            <p className="mt-5 font-[family-name:var(--font-display)] text-4xl font-semibold text-graphite">
              {card.value}
            </p>
            <p className="mt-1 text-sm text-graphite/55">{card.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-3xl bg-white p-7 shadow-soft">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-graphite/60">
          Próximas viagens no site
        </h2>
        <div className="divide-y divide-graphite/6">
          {trips.map((trip) => (
            <Link
              key={trip.id}
              href={`/admin/viagens/${trip.id}`}
              className="flex items-center justify-between py-3.5 transition-colors hover:text-rose-dark"
            >
              <div>
                <p className="text-sm font-semibold text-graphite">{trip.title}</p>
                <p className="text-xs text-graphite/50">
                  {trip.destination} · {trip.date}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                  trip.spotsLeft <= 12
                    ? "bg-rose/10 text-rose"
                    : "bg-gold/10 text-gold-dark"
                }`}
              >
                {trip.spotsLeft} vagas
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
