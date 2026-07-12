"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Trash2, Camera, ExternalLink, Star } from "lucide-react";
import type { GalleryItem, Trip } from "@/lib/types";
import ImageUploader from "@/components/admin/ImageUploader";

const inputClass =
  "w-full rounded-xl border border-graphite/15 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rose";
const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-graphite/55";

export default function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripSlug, setTripSlug] = useState("");
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const [gRes, tRes] = await Promise.all([
      fetch("/api/admin/gallery"),
      fetch("/api/admin/trips"),
    ]);
    setItems(await gRes.json());
    setTrips(await tRes.json());
  }

  useEffect(() => {
    load();
  }, []);

  const albums = useMemo(() => {
    const known = trips.map((trip) => ({
      trip,
      photos: items.filter((g) => g.tripSlug === trip.slug),
    }));
    const orphans = items.filter(
      (g) => !g.tripSlug || !trips.some((t) => t.slug === g.tripSlug)
    );
    return { known, orphans };
  }, [items, trips]);

  async function add(url: string) {
    if (!tripSlug) {
      setError("Selecione a viagem antes de enviar a foto.");
      return;
    }
    setError("");
    const res = await fetch("/api/admin/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: url, caption, tripSlug }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao salvar a foto.");
      return;
    }
    setCaption("");
    load();
  }

  async function moveTo(item: GalleryItem, slug: string) {
    await fetch(`/api/admin/gallery/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripSlug: slug }),
    });
    load();
  }

  async function remove(item: GalleryItem) {
    if (!confirm("Excluir esta foto da galeria?")) return;
    await fetch(`/api/admin/gallery/${item.id}`, { method: "DELETE" });
    load();
  }

  async function setCover(item: GalleryItem) {
    await fetch(`/api/admin/gallery/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cover: true }),
    });
    load();
  }

  function PhotoCard({ item }: { item: GalleryItem }) {
    return (
      <div
        className={`group relative h-48 overflow-hidden rounded-2xl shadow-soft ${
          item.cover ? "ring-2 ring-gold" : ""
        }`}
      >
        <Image
          src={item.image}
          alt={item.caption ?? "Foto da galeria"}
          fill
          sizes="300px"
          className="object-cover"
        />

        {/* Selo de capa sempre visível */}
        {item.cover && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-[10px] font-bold text-graphite shadow-soft">
            <Star size={10} className="fill-graphite" />
            Capa do álbum
          </span>
        )}

        <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-graphite/80 via-transparent to-graphite/40 p-3 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
          <div className="flex items-start justify-between gap-2">
            <select
              value={item.tripSlug ?? ""}
              onChange={(e) => moveTo(item, e.target.value)}
              className="min-w-0 flex-1 rounded-lg bg-white/90 px-2 py-1.5 text-[11px] font-medium text-graphite outline-none"
              title="Mover para outra viagem"
            >
              <option value="" disabled>
                Vincular à viagem...
              </option>
              {trips.map((t) => (
                <option key={t.id} value={t.slug}>
                  {t.title}
                </option>
              ))}
            </select>
            <button
              onClick={() => remove(item)}
              title="Excluir foto"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-graphite/60 text-white transition-colors hover:bg-rose"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div className="flex items-end justify-between gap-2">
            <p className="text-xs font-medium text-white">{item.caption}</p>
            {!item.cover && (
              <button
                onClick={() => setCover(item)}
                title="Definir como capa do álbum"
                className="flex shrink-0 items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-graphite transition-colors hover:bg-gold"
              >
                <Star size={11} />
                Usar como capa
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-graphite">
          Galeria do Site
        </h1>
        <p className="mt-1 text-sm text-graphite/55">
          Cada foto pertence ao álbum de uma viagem. Na página inicial aparece a
          capa de cada álbum; ao clicar, o visitante vê todas as fotos daquela
          viagem.
        </p>
      </div>

      <div className="mb-10 rounded-3xl bg-white p-6 shadow-soft">
        <div className="mb-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>Viagem do álbum *</label>
            <select
              className={inputClass}
              value={tripSlug}
              onChange={(e) => {
                setTripSlug(e.target.value);
                setError("");
              }}
            >
              <option value="">Selecione a viagem...</option>
              {trips.map((t) => (
                <option key={t.id} value={t.slug}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Legenda (opcional)</label>
            <input
              className={inputClass}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Ex.: Oktoberfest Blumenau 2025"
            />
          </div>
        </div>
        <ImageUploader label="Adicionar foto ao álbum" onUploaded={add} />
        {error && <p className="mt-3 text-xs text-rose">{error}</p>}
        <p className="mt-3 text-[11px] text-graphite/45">
          As imagens enviadas são otimizadas automaticamente (redimensionadas e
          convertidas para WebP) para manter o site rápido.
        </p>
      </div>

      <div className="space-y-10">
        {albums.known.map(({ trip, photos }) => (
          <div key={trip.id}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2.5 font-[family-name:var(--font-display)] text-lg font-semibold text-graphite">
                <Camera size={17} className="text-gold-dark" />
                {trip.title}
                <span className="rounded-full bg-blush px-2.5 py-0.5 text-[11px] font-semibold text-rose-dark">
                  {photos.length} {photos.length === 1 ? "foto" : "fotos"}
                </span>
              </h2>
              {photos.length > 0 && (
                <a
                  href={`/galeria/${trip.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-semibold text-rose transition-colors hover:text-rose-dark"
                >
                  Ver álbum no site
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
            {photos.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {photos.map((item) => (
                  <PhotoCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-graphite/15 p-6 text-center text-xs text-graphite/45">
                Nenhuma foto neste álbum ainda. O álbum só aparece no site
                quando tiver fotos.
              </p>
            )}
          </div>
        ))}

        {albums.orphans.length > 0 && (
          <div>
            <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg font-semibold text-rose">
              Fotos sem viagem vinculada
            </h2>
            <p className="mb-4 text-xs text-graphite/55">
              Estas fotos não aparecem no site. Use o seletor sobre cada foto
              para vinculá-las a uma viagem.
            </p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {albums.orphans.map((item) => (
                <PhotoCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
