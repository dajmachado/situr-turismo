import Link from "next/link";
import { ArrowRight } from "lucide-react";
import HeroCarousel from "@/components/HeroCarousel";
import TripCard from "@/components/TripCard";
import SectionHeading from "@/components/SectionHeading";
import Differentials from "@/components/Differentials";
import Stats from "@/components/Stats";
import Testimonials from "@/components/Testimonials";
import GalleryShowcase, { buildAlbums } from "@/components/GalleryShowcase";
import CtaBanner from "@/components/CtaBanner";
import Reveal from "@/components/Reveal";
import {
  getBanners,
  getTripsWithLiveSpots,
  getGallery,
  getTestimonials,
} from "@/lib/db";
import { siteConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [banners, trips, gallery, testimonials] = await Promise.all([
    getBanners(),
    getTripsWithLiveSpots(),
    getGallery(),
    getTestimonials(),
  ]);

  const featured = trips.filter((t) => t.featured).slice(0, 6);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: siteConfig.name,
    telephone: siteConfig.phone,
    email: siteConfig.email,
    address: { "@type": "PostalAddress", streetAddress: siteConfig.address },
    url: "https://siturturismo.com.br",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <HeroCarousel banners={banners} />

      {/* Próximas viagens */}
      <section className="container-site py-24">
        <SectionHeading
          label="Próximas viagens"
          title="Escolha seu próximo destino"
          subtitle="Roteiros pensados nos mínimos detalhes, com saídas confirmadas e vagas limitadas."
        />
        <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((trip, i) => (
            <Reveal key={trip.id} delay={i * 0.1}>
              <TripCard trip={trip} />
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-12 text-center">
          <Link
            href="/viagens"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-rose transition-colors hover:text-rose-dark"
          >
            Ver todas as viagens
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </Reveal>
      </section>

      <Differentials />
      <Stats />
      <Testimonials items={testimonials} />
      <GalleryShowcase albums={buildAlbums(trips, gallery)} />
      <CtaBanner image={banners[0]?.image} />
    </>
  );
}
