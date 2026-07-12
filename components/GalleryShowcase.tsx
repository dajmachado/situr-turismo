import Image from "next/image";
import Link from "next/link";
import { Camera, ArrowUpRight } from "lucide-react";
import type { Trip, GalleryItem } from "@/lib/types";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";

export type Album = {
  trip: Trip;
  photos: GalleryItem[];
  cover: GalleryItem;
};

export function buildAlbums(trips: Trip[], gallery: GalleryItem[]): Album[] {
  return trips
    .map((trip) => {
      const photos = gallery.filter((g) => g.tripSlug === trip.slug);
      return {
        trip,
        photos,
        // Usa a foto marcada como capa; se nenhuma, cai na primeira
        cover: photos.find((p) => p.cover) ?? photos[0],
      };
    })
    .filter((album) => album.photos.length > 0);
}

export default function GalleryShowcase({ albums }: { albums: Album[] }) {
  if (albums.length === 0) return null;

  return (
    <section id="galeria" className="scroll-mt-24 bg-blush-light py-24">
      <div className="container-site">
        <SectionHeading
          label="Galeria"
          title="Momentos que viram memórias"
          subtitle="Explore os álbuns de cada viagem e veja o que nossos viajantes já viveram com a SITUR."
        />

        <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          {albums.map((album, i) => (
            <Reveal key={album.trip.id} delay={(i % 3) * 0.1}>
              <Link
                href={`/galeria/${album.trip.slug}`}
                className="group card-hover relative block aspect-[4/5] overflow-hidden rounded-3xl shadow-soft"
              >
                <Image
                  src={album.cover.image}
                  alt={`Álbum de fotos — ${album.trip.title}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-108"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-graphite/85 via-graphite/20 to-transparent" />

                <span className="absolute right-5 top-5 flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-[11px] font-semibold text-white backdrop-blur-md">
                  <Camera size={12} />
                  {album.photos.length}{" "}
                  {album.photos.length === 1 ? "foto" : "fotos"}
                </span>

                <div className="absolute inset-x-0 bottom-0 p-7">
                  <p className="text-xs font-medium uppercase tracking-[0.25em] text-gold-light">
                    {album.trip.destination}
                  </p>
                  <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold leading-snug text-white">
                    {album.trip.title}
                  </h3>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white/85 transition-all duration-300 group-hover:gap-3.5 group-hover:text-gold-light">
                    Ver álbum completo
                    <ArrowUpRight size={16} />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
