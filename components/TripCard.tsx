import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, Users, ArrowRight } from "lucide-react";
import type { Trip } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export default function TripCard({ trip }: { trip: Trip }) {
  const lowSpots = trip.spotsLeft <= Math.max(5, trip.spotsTotal * 0.2);

  return (
    <Link
      href={`/viagens/${trip.slug}`}
      className="group card-hover flex flex-col overflow-hidden rounded-3xl bg-white shadow-soft"
    >
      <div className="relative h-60 overflow-hidden">
        <Image
          src={trip.coverImage}
          alt={trip.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-graphite/60 via-transparent to-transparent" />
        <span
          className={`absolute left-4 top-4 rounded-full px-3.5 py-1.5 text-[11px] font-semibold tracking-wide backdrop-blur-md ${
            lowSpots
              ? "bg-rose/90 text-white"
              : "bg-white/85 text-graphite"
          }`}
        >
          {lowSpots
            ? `Últimas ${trip.spotsLeft} vagas!`
            : `${trip.spotsLeft} vagas disponíveis`}
        </span>
        <div className="absolute bottom-4 left-4 flex items-center gap-1.5 text-white">
          <MapPin size={14} className="text-gold-light" />
          <span className="text-sm font-medium">{trip.destination}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-graphite transition-colors group-hover:text-rose-dark">
          {trip.title}
        </h3>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-graphite/60">
          <span className="flex items-center gap-1.5">
            <Calendar size={13} className="text-gold-dark" />
            {trip.date}
          </span>
          <span className="flex items-center gap-1.5">
            <Users size={13} className="text-gold-dark" />
            {trip.duration}
          </span>
        </div>
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-graphite/65">
          {trip.shortDescription}
        </p>

        <div className="mt-5 flex items-end justify-between border-t border-graphite/8 pt-5">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-graphite/50">
              A partir de
            </p>
            <p className="font-[family-name:var(--font-display)] text-2xl font-semibold text-graphite">
              {formatPrice(trip.price)}
            </p>
            <p className="text-[11px] text-gold-dark">{trip.installments}</p>
          </div>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-rose transition-all group-hover:gap-3 group-hover:text-rose-dark">
            Ver detalhes
            <ArrowRight size={15} />
          </span>
        </div>
      </div>
    </Link>
  );
}
