import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MapPin, CalendarDays, Route, ArrowRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import CtaBanner from "@/components/CtaBanner";
import Reveal from "@/components/Reveal";
import { getTrips } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Roteiros Interativos",
  description:
    "Explore os roteiros interativos das excursões SITUR: navegue dia a dia por passeios, horários, fotos e mapas.",
  alternates: { canonical: "/roteiros" },
};

export default async function ItinerariesPage() {
  const trips = (await getTrips()).filter((t) => t.itinerary.length > 0);

  return (
    <>
      <PageHeader
        label="Roteiros interativos"
        title="Viva a viagem antes de embarcar"
        subtitle="Cada excursão tem um roteiro interativo: explore os dias, passeios, horários e mapas de forma intuitiva."
      />
      <section className="container-site space-y-8 py-20">
        {trips.map((trip, i) => (
          <Reveal key={trip.id} delay={i * 0.08}>
            <Link
              href={`/viagens/${trip.slug}#roteiro`}
              className="group card-hover flex flex-col overflow-hidden rounded-3xl bg-white shadow-soft md:flex-row"
            >
              <div className="relative h-56 w-full shrink-0 overflow-hidden md:h-auto md:w-80">
                <Image
                  src={trip.coverImage}
                  alt={trip.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 320px"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <div className="flex flex-1 flex-col justify-center p-8 lg:p-10">
                <p className="flex items-center gap-2 text-sm font-medium text-gold-dark">
                  <MapPin size={14} />
                  {trip.destination}
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-graphite transition-colors group-hover:text-rose-dark">
                  {trip.title}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-graphite/60">
                  {trip.shortDescription}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-graphite/55">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={14} className="text-gold-dark" />
                    {trip.date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Route size={14} className="text-gold-dark" />
                    {trip.itinerary.length}{" "}
                    {trip.itinerary.length === 1 ? "dia de roteiro" : "dias de roteiro"}
                  </span>
                </div>
                <span className="mt-6 flex items-center gap-2 text-sm font-semibold text-rose transition-all group-hover:gap-4 group-hover:text-rose-dark">
                  Explorar roteiro interativo
                  <ArrowRight size={16} />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </section>
      <CtaBanner />
    </>
  );
}
