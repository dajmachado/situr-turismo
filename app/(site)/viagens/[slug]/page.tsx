import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Check,
  X,
  BedDouble,
  CreditCard,
  Lock,
  ShieldCheck,
} from "lucide-react";
import {
  getTripBySlug,
  getTripBySlugWithLiveSpots,
  getTrips,
  getTestimonials,
} from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { whatsappLink } from "@/lib/site-config";
import TripGallery from "@/components/TripGallery";
import Itinerary from "@/components/Itinerary";
import FaqAccordion from "@/components/FaqAccordion";
import Testimonials from "@/components/Testimonials";
import Reveal from "@/components/Reveal";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const trip = await getTripBySlug(slug);
  if (!trip) return { title: "Viagem não encontrada" };
  return {
    title: `${trip.title} — ${trip.date}`,
    description: trip.shortDescription,
    alternates: { canonical: `/viagens/${trip.slug}` },
    openGraph: {
      title: `${trip.title} | SITUR Turismo`,
      description: trip.shortDescription,
      images: [{ url: trip.coverImage, width: 1200, height: 630 }],
    },
  };
}

export default async function TripPage({ params }: Props) {
  const { slug } = await params;
  const [trip, testimonials] = await Promise.all([
    getTripBySlugWithLiveSpots(slug),
    getTestimonials(),
  ]);
  if (!trip) notFound();

  const reserveLink = whatsappLink(
    `Olá! Quero reservar uma vaga na viagem "${trip.title}" (${trip.date}).`
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: trip.title,
    description: trip.shortDescription,
    touristType: "Excursão em grupo",
    offers: {
      "@type": "Offer",
      price: trip.price,
      priceCurrency: "BRL",
      availability:
        trip.spotsLeft > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/SoldOut",
    },
    provider: { "@type": "TravelAgency", name: "SITUR Turismo" },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="relative flex h-[70svh] min-h-[480px] items-end overflow-hidden bg-graphite">
        <Image
          src={trip.coverImage}
          alt={trip.title}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-graphite/90 via-graphite/30 to-graphite/20" />
        <div className="container-site relative z-10 pb-14">
          <Reveal direction="up">
            <p className="flex items-center gap-2 text-sm font-medium text-gold-light">
              <MapPin size={15} />
              {trip.destination}
            </p>
            <h1 className="mt-3 max-w-3xl font-[family-name:var(--font-display)] text-4xl font-medium leading-tight text-white sm:text-5xl">
              {trip.title}
            </h1>
            <div className="mt-5 flex flex-wrap items-center gap-x-7 gap-y-2 text-sm text-white/80">
              <span className="flex items-center gap-2">
                <Calendar size={15} className="text-gold-light" />
                {trip.date}
              </span>
              <span className="flex items-center gap-2">
                <Clock size={15} className="text-gold-light" />
                {trip.duration}
              </span>
              <span className="flex items-center gap-2">
                <Users size={15} className="text-gold-light" />
                {trip.spotsLeft} vagas restantes
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      <div className="container-site grid gap-12 py-16 lg:grid-cols-[1fr_360px]">
        {/* Main content */}
        <div className="min-w-0 space-y-20">
          <Reveal>
            <div>
              <p className="section-label">Sobre a viagem</p>
              <p className="max-w-3xl text-base leading-relaxed text-graphite/70">
                {trip.description}
              </p>
            </div>
          </Reveal>

          {trip.gallery.length > 0 && (
            <Reveal>
              <div>
                <p className="section-label">Galeria</p>
                <h2 className="heading-display mb-8 !text-2xl sm:!text-3xl">
                  Um gostinho do que espera por você
                </h2>
                <TripGallery images={trip.gallery} title={trip.title} />
              </div>
            </Reveal>
          )}

          {trip.itinerary.length > 0 && (
            <div id="roteiro" className="scroll-mt-28">
              <Reveal>
                <p className="section-label">Roteiro interativo</p>
                <h2 className="heading-display mb-8 !text-2xl sm:!text-3xl">
                  Navegue pela sua viagem, dia a dia
                </h2>
              </Reveal>
              <Itinerary days={trip.itinerary} />
            </div>
          )}

          {trip.hotel && (
            <Reveal>
              <div>
                <p className="section-label">Hospedagem</p>
                <div className="card-hover overflow-hidden rounded-3xl bg-white shadow-soft">
                  <div className="flex flex-col md:flex-row">
                    {trip.hotel.image && (
                      <div className="relative h-56 w-full md:h-auto md:w-72">
                        <Image
                          src={trip.hotel.image}
                          alt={trip.hotel.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 288px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 p-8">
                      <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-blush px-3.5 py-1.5 text-xs font-semibold text-rose-dark">
                        <BedDouble size={13} />
                        Hospedagem
                      </span>
                      <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-graphite">
                        {trip.hotel.name}
                      </h3>
                      <p className="mt-2.5 text-sm leading-relaxed text-graphite/60">
                        {trip.hotel.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          )}

          {/* Included / not included */}
          <Reveal>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-graphite/8 bg-white p-8 shadow-soft">
                <h3 className="mb-5 font-[family-name:var(--font-display)] text-lg font-semibold text-graphite">
                  O que está incluso
                </h3>
                <ul className="space-y-3">
                  {trip.included.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-graphite/70">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold-dark">
                        <Check size={12} strokeWidth={3} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl border border-graphite/8 bg-white p-8 shadow-soft">
                <h3 className="mb-5 font-[family-name:var(--font-display)] text-lg font-semibold text-graphite">
                  O que não está incluso
                </h3>
                <ul className="space-y-3">
                  {trip.notIncluded.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-graphite/70">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose/10 text-rose">
                        <X size={12} strokeWidth={3} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>

          {trip.mapEmbedUrl && (
            <Reveal>
              <div>
                <p className="section-label">Localização</p>
                <div className="overflow-hidden rounded-3xl shadow-soft">
                  <iframe
                    src={trip.mapEmbedUrl}
                    title={`Mapa — ${trip.title}`}
                    className="h-96 w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </Reveal>
          )}

          {trip.faq.length > 0 && (
            <Reveal>
              <div>
                <p className="section-label">Perguntas frequentes</p>
                <h2 className="heading-display mb-8 !text-2xl sm:!text-3xl">
                  Tire suas dúvidas
                </h2>
                <FaqAccordion items={trip.faq} />
              </div>
            </Reveal>
          )}
        </div>

        {/* Sidebar — booking card */}
        <aside className="lg:pt-2">
          <Reveal direction="left">
            <div className="sticky top-28 space-y-5">
              <div className="overflow-hidden rounded-3xl bg-white shadow-lifted">
                <div className="bg-gradient-to-r from-rose to-rose-dark px-7 py-5 text-white">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/70">
                    Investimento
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold">
                    {formatPrice(trip.price)}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-white/85">
                    <CreditCard size={13} />
                    {trip.installments}
                  </p>
                </div>
                <div className="space-y-4 p-7">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-graphite/55">Data de saída</span>
                    <span className="font-semibold text-graphite">{trip.date}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-graphite/55">Duração</span>
                    <span className="font-semibold text-graphite">{trip.duration}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-graphite/55">Vagas restantes</span>
                    <span
                      className={`font-semibold ${trip.spotsLeft <= 12 ? "text-rose" : "text-graphite"}`}
                    >
                      {trip.spotsLeft} de {trip.spotsTotal}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-blush">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold to-rose"
                      style={{
                        width: `${Math.round(((trip.spotsTotal - trip.spotsLeft) / trip.spotsTotal) * 100)}%`,
                      }}
                    />
                  </div>
                  <Link
                    href={`/checkout/${trip.slug}`}
                    className="btn-primary w-full"
                  >
                    <Lock size={14} />
                    Reservar e pagar online
                  </Link>
                  <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-graphite/50">
                    <ShieldCheck size={13} className="text-[#00c46b]" />
                    Compre com segurança — Pix ou cartão em até 12x
                  </p>
                  <a
                    href={reserveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-[#25D366]/40 px-7 py-3.5 text-sm font-semibold text-[#128C4B] transition-all hover:bg-[#25D366] hover:text-white"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Falar no WhatsApp
                  </a>
                  <p className="text-center text-[11px] text-graphite/45">
                    Atendimento rápido e sem compromisso
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </aside>
      </div>

      <Testimonials items={testimonials} />
    </>
  );
}

export async function generateStaticParams() {
  const trips = await getTrips();
  return trips.map((t) => ({ slug: t.slug }));
}
