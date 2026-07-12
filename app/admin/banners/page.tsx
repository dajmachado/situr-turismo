"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Trash2, Pencil, X, Loader2 } from "lucide-react";
import type { Banner, Trip } from "@/lib/types";
import ImageUploader from "@/components/admin/ImageUploader";

const inputClass =
  "w-full rounded-xl border border-graphite/15 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rose";
const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-graphite/55";

const emptyBanner: Omit<Banner, "id"> = {
  title: "",
  subtitle: "",
  price: "",
  image: "",
  tripSlug: "",
  order: 1,
};

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [editing, setEditing] = useState<Banner | Omit<Banner, "id"> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const [bRes, tRes] = await Promise.all([
      fetch("/api/admin/banners"),
      fetch("/api/admin/trips"),
    ]);
    setBanners(await bRes.json());
    setTrips(await tRes.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (!editing) return;
    if (!editing.title.trim() || !editing.image) {
      setError("Título e imagem são obrigatórios.");
      return;
    }
    setSaving(true);
    setError("");
    const isEdit = "id" in editing;
    const res = await fetch(
      isEdit ? `/api/admin/banners/${editing.id}` : "/api/admin/banners",
      {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      }
    );
    setSaving(false);
    if (res.ok) {
      setEditing(null);
      load();
    } else {
      setError("Erro ao salvar o banner.");
    }
  }

  async function remove(banner: Banner) {
    if (!confirm(`Excluir o banner "${banner.title}"?`)) return;
    await fetch(`/api/admin/banners/${banner.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-graphite">
            Banners do Carrossel
          </h1>
          <p className="mt-1 text-sm text-graphite/55">
            Os banners aparecem no topo da página inicial, na ordem definida.
          </p>
        </div>
        <button
          onClick={() =>
            setEditing({ ...emptyBanner, order: banners.length + 1 })
          }
          className="btn-primary"
        >
          <Plus size={16} />
          Novo banner
        </button>
      </div>

      <div className="space-y-4">
        {banners.map((banner) => (
          <div
            key={banner.id}
            className="flex flex-col gap-4 overflow-hidden rounded-3xl bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:gap-5"
          >
            <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-2xl sm:h-24 sm:w-44">
              <Image src={banner.image} alt={banner.title} fill sizes="(max-width: 640px) 100vw, 176px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-graphite">
                <span className="mr-2 rounded-full bg-gold/15 px-2.5 py-0.5 text-[11px] font-bold text-gold-dark">
                  #{banner.order}
                </span>
                {banner.title}
              </p>
              <p className="mt-1 truncate text-xs text-graphite/50">{banner.subtitle}</p>
              {banner.tripSlug && (
                <p className="mt-1 text-[11px] text-rose">→ /viagens/{banner.tripSlug}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => setEditing(banner)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-graphite/45 transition-colors hover:bg-blush hover:text-rose-dark"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => remove(banner)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-graphite/45 transition-colors hover:bg-rose/10 hover:text-rose"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {banners.length === 0 && (
          <p className="rounded-3xl bg-white p-10 text-center text-sm text-graphite/45 shadow-soft">
            Nenhum banner cadastrado.
          </p>
        )}
      </div>

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-graphite/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 shadow-lifted sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-graphite">
                {"id" in editing ? "Editar banner" : "Novo banner"}
              </h2>
              <button
                onClick={() => setEditing(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-graphite/45 hover:bg-blush"
              >
                <X size={17} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>Título *</label>
                <input
                  className={inputClass}
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  placeholder="Ex.: Excursão Oktoberfest 2026"
                />
              </div>
              <div>
                <label className={labelClass}>Subtítulo</label>
                <textarea
                  className={`${inputClass} h-20 resize-none`}
                  value={editing.subtitle}
                  onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className={labelClass}>Preço (texto)</label>
                  <input
                    className={inputClass}
                    value={editing.price ?? ""}
                    onChange={(e) => setEditing({ ...editing, price: e.target.value })}
                    placeholder="10x de R$ 48,90"
                  />
                </div>
                <div>
                  <label className={labelClass}>Ordem</label>
                  <input
                    type="number"
                    min={1}
                    className={inputClass}
                    value={editing.order}
                    onChange={(e) =>
                      setEditing({ ...editing, order: Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>Viagem vinculada</label>
                  <select
                    className={inputClass}
                    value={editing.tripSlug ?? ""}
                    onChange={(e) =>
                      setEditing({ ...editing, tripSlug: e.target.value })
                    }
                  >
                    <option value="">Nenhuma (institucional)</option>
                    {trips.map((t) => (
                      <option key={t.id} value={t.slug}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Imagem do banner *</label>
                {editing.image && (
                  <div className="relative mb-3 h-40 overflow-hidden rounded-2xl">
                    <Image src={editing.image} alt="Banner" fill sizes="600px" className="object-cover" />
                    <button
                      onClick={() => setEditing({ ...editing, image: "" })}
                      className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-graphite/70 text-white hover:bg-rose"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
                <ImageUploader
                  label={editing.image ? "Trocar imagem" : "Adicionar imagem"}
                  onUploaded={(url) => setEditing({ ...editing, image: url })}
                />
              </div>

              {error && <p className="text-xs text-rose">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setEditing(null)}
                  className="rounded-full px-6 py-3 text-sm font-semibold text-graphite/55 hover:text-graphite"
                >
                  Cancelar
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="btn-primary disabled:opacity-60"
                >
                  {saving && <Loader2 size={15} className="animate-spin" />}
                  {saving ? "Salvando..." : "Salvar banner"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
