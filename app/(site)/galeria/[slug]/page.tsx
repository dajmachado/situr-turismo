import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Camera, MapPin } from "lucide-react";
import { getTripBySlug, getGallery } from "@/lib/db";
import PhotoMasonry from "@/components/PhotoMasonry";
import Reveal from "@/components/Reveal";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const trip = await getTripBySlug(slug);
  if (!trip) return { title: "Álbum não encontrado" };
  return {
    title: `Álbum de fotos — ${trip.title}`,
    description: `Veja todas as fotos da ${trip.title} com a SITUR Turismo.`,
    alternates: { canonical: `/galeria/${trip.slug}` },
  };
}

export default async function TripAlbumPage({ params }: Props) {
  const { slug } = await params;
  const [trip, gallery] = await Promise.all([getTripBySlug(slug), getGallery()]);
  if (!trip) notFound();

  const photos = gallery.filter((g) => g.tripSlug === trip.slug);
  const cover = photos.find((p) => p.cover) ?? photos[0];

  return (
    <>
      {/* Hero do álbum */}
      <section className="relative flex h-[52svh] min-h-[380px] items-end overflow-hidden bg-graphite">
        <Image
          src={cover?.image ?? trip.coverImage}
          alt={trip.title}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-graphite/90 via-graphite/35 to-graphite/20" />
        <div className="container-site relative z-10 pb-12">
          <Reveal>
            <Link
              href="/#galeria"
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-gold-light"
            >
              <ArrowLeft size={15} />
              Todos os álbuns
            </Link>
            <p className="flex items-center gap-2 text-sm font-medium text-gold-light">
              <MapPin size={15} />
              {trip.destination}
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-medium leading-tight text-white sm:text-5xl">
              Álbum — {trip.title}
            </h1>
            <p className="mt-4 flex items-center gap-2 text-sm text-white/75">
              <Camera size={15} className="text-gold-light" />
              {photos.length} {photos.length === 1 ? "foto" : "fotos"} desta
              viagem
            </p>
          </Reveal>
        </div>
      </section>

      <section className="container-site py-16">
        {photos.length > 0 ? (
          <PhotoMasonry items={photos} />
        ) : (
          <p className="py-16 text-center text-graphite/50">
            Este álbum ainda não tem fotos. Volte em breve!
          </p>
        )}

        <Reveal className="mt-16">
          <div className="flex flex-col items-center gap-5 rounded-[2.5rem] bg-blush-light px-8 py-12 text-center">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-graphite sm:text-3xl">
              Quer viver isso de perto?
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-graphite/60">
              A próxima saída da {trip.title} é em {trip.date}. Garanta sua
              vaga e apareça no próximo álbum.
            </p>
            <Link href={`/viagens/${trip.slug}`} className="btn-primary">
              Ver detalhes da viagem
              <ArrowRight size={16} />
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
