"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Trash2,
  Plus,
  Loader2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Check,
} from "lucide-react";
import type { Trip, ItineraryDay } from "@/lib/types";
import { parseActivityTime, sortActivitiesByTime } from "@/lib/utils";
import { generateBusLayout, BUS_MODELS, type BusModelId } from "@/lib/bus";
import BusSeatMap from "@/components/checkout/BusSeatMap";
import CurrencyInput from "@/components/CurrencyInput";
import DateField from "./DateField";
import ImageUploader from "./ImageUploader";

const emptyTrip: Omit<Trip, "id"> = {
  slug: "",
  title: "",
  destination: "",
  date: "",
  duration: "",
  price: 0,
  installments: "",
  spotsTotal: 46,
  spotsLeft: 46,
  shortDescription: "",
  description: "",
  coverImage: "",
  gallery: [],
  hotel: { name: "", description: "", image: "" },
  included: [],
  notIncluded: [],
  mapEmbedUrl: "",
  itinerary: [],
  faq: [],
  featured: true,
  busModel: "exec46",
  busCount: 1,
  blockedSeats: [],
};

const tabs = [
  { id: "dados", label: "Dados" },
  { id: "imagens", label: "Imagens" },
  { id: "onibus", label: "Ônibus" },
  { id: "roteiro", label: "Roteiro" },
  { id: "detalhes", label: "Detalhes" },
  { id: "faq", label: "FAQ" },
] as const;

type TabId = (typeof tabs)[number]["id"];

const inputClass =
  "w-full rounded-xl border border-graphite/15 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rose";
const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-graphite/55";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

export default function TripForm({ trip }: { trip?: Trip }) {
  const [form, setForm] = useState<Omit<Trip, "id">>(
    trip ?? structuredClone(emptyTrip)
  );
  const [tab, setTab] = useState<TabId>("dados");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [heldSeats, setHeldSeats] = useState<string[]>([]);
  const router = useRouter();

  // Assentos vendidos online (reservas ativas) — não podem ser desbloqueados
  useEffect(() => {
    if (!trip) return;
    fetch(`/api/checkout/seats?tripSlug=${trip.slug}`)
      .then((r) => r.json())
      .then((d) => setHeldSeats(d.held ?? []))
      .catch(() => {});
  }, [trip]);

  const busModel: BusModelId = form.busModel === "dd43" ? "dd43" : "exec46";
  const busCount = form.busCount ?? 1;
  const busLayout = useMemo(
    () => generateBusLayout(busModel, busCount),
    [busModel, busCount]
  );

  // Vagas são sempre derivadas do mapa de poltronas — nunca editadas à mão
  const capacity = BUS_MODELS[busModel].seats * busCount;
  const occupiedCount = useMemo(
    () => new Set([...heldSeats, ...(form.blockedSeats ?? [])]).size,
    [heldSeats, form.blockedSeats]
  );
  const computedSpotsLeft = Math.max(0, capacity - occupiedCount);

  // Trocar o tipo/quantidade de ônibus muda a capacidade (derivada) e limpa bloqueios
  function setBusConfig(model: BusModelId, count: number) {
    setForm((f) => ({
      ...f,
      busModel: model,
      busCount: count,
      blockedSeats: [],
    }));
  }

  function set<K extends keyof Omit<Trip, "id">>(key: K, value: Omit<Trip, "id">[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleBlockedSeat(seat: string) {
    const current = form.blockedSeats ?? [];
    set(
      "blockedSeats",
      current.includes(seat)
        ? current.filter((s) => s !== seat)
        : [...current, seat]
    );
  }

  function setDay(index: number, day: ItineraryDay) {
    const itinerary = [...form.itinerary];
    itinerary[index] = day;
    set("itinerary", itinerary);
  }

  async function save() {
    if (!form.title.trim()) {
      setError("Informe o título da viagem.");
      setTab("dados");
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch(
      trip ? `/api/admin/trips/${trip.id}` : "/api/admin/trips",
      {
        method: trip ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          spotsTotal: capacity,
          spotsLeft: computedSpotsLeft,
        }),
      }
    );
    setSaving(false);
    if (res.ok) {
      router.push("/admin/viagens");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao salvar. Tente novamente.");
    }
  }

  return (
    <div>
      {/* Tabs */}
      <div className="mb-8 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
              tab === t.id
                ? "bg-rose text-white shadow-soft"
                : "bg-white text-graphite/60 shadow-soft hover:text-graphite"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-soft sm:p-8">
        {/* ===== DADOS ===== */}
        {tab === "dados" && (
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <Field label="Título da viagem *">
                <input
                  className={inputClass}
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Ex.: Excursão Oktoberfest"
                />
              </Field>
            </div>
            <Field label="Destino">
              <input
                className={inputClass}
                value={form.destination}
                onChange={(e) => set("destination", e.target.value)}
                placeholder="Ex.: Blumenau — SC"
              />
            </Field>
            <Field label="Data de saída">
              <DateField
                className={inputClass}
                value={form.date}
                onChange={(v) => set("date", v)}
              />
            </Field>
            <Field label="Duração">
              <input
                className={inputClass}
                value={form.duration}
                onChange={(e) => set("duration", e.target.value)}
                placeholder="Ex.: 3 dias / 2 noites"
              />
            </Field>
            <Field label="Preço">
              <CurrencyInput
                className={inputClass}
                value={form.price}
                onChange={(v) => set("price", v)}
              />
            </Field>
            <Field label="Parcelamento">
              <input
                className={inputClass}
                value={form.installments}
                onChange={(e) => set("installments", e.target.value)}
                placeholder="Ex.: 10x de R$ 48,90 sem juros"
              />
            </Field>
            <div className="grid grid-cols-2 gap-5">
              <Field label="Vagas totais">
                <div className={`${inputClass} flex items-center bg-blush-light/60 text-graphite/70`}>
                  {capacity}
                </div>
              </Field>
              <Field label="Vagas restantes">
                <div
                  className={`${inputClass} flex items-center bg-blush-light/60 font-semibold ${
                    computedSpotsLeft === 0 ? "text-rose" : "text-graphite"
                  }`}
                >
                  {computedSpotsLeft}
                </div>
              </Field>
            </div>
            <p className="text-[11px] text-graphite/45">
              Vagas calculadas automaticamente a partir do tipo/quantidade de
              ônibus (aba Ônibus) e das poltronas ocupadas no mapa — não são
              editadas manualmente.
            </p>
            <div className="md:col-span-2">
              <Field label="Descrição curta (aparece nos cards)">
                <textarea
                  className={`${inputClass} h-20 resize-none`}
                  value={form.shortDescription}
                  onChange={(e) => set("shortDescription", e.target.value)}
                />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Descrição completa">
                <textarea
                  className={`${inputClass} h-32 resize-none`}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </Field>
            </div>
            <label className="flex items-center gap-2.5 text-sm text-graphite/70">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => set("featured", e.target.checked)}
                className="h-4 w-4 accent-rose"
              />
              Exibir na página inicial
            </label>
          </div>
        )}

        {/* ===== IMAGENS ===== */}
        {tab === "imagens" && (
          <div className="space-y-8">
            <div>
              <label className={labelClass}>Imagem de capa (banner da viagem)</label>
              {form.coverImage && (
                <div className="relative mb-3 h-48 overflow-hidden rounded-2xl">
                  <Image
                    src={form.coverImage}
                    alt="Capa"
                    fill
                    sizes="600px"
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => set("coverImage", "")}
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-graphite/70 text-white transition-colors hover:bg-rose"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
              <ImageUploader
                label={form.coverImage ? "Trocar imagem de capa" : "Adicionar imagem de capa"}
                onUploaded={(url) => set("coverImage", url)}
              />
            </div>

            <div>
              <label className={labelClass}>
                Galeria da viagem ({form.gallery.length}{" "}
                {form.gallery.length === 1 ? "foto" : "fotos"})
              </label>
              {form.gallery.length > 0 && (
                <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {form.gallery.map((img, i) => (
                    <div key={i} className="group relative h-28 overflow-hidden rounded-xl">
                      <Image src={img} alt={`Foto ${i + 1}`} fill sizes="200px" className="object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          set("gallery", form.gallery.filter((_, j) => j !== i))
                        }
                        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-graphite/70 text-white opacity-0 transition-opacity hover:bg-rose group-hover:opacity-100"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <ImageUploader
                label="Adicionar foto à galeria"
                onUploaded={(url) => set("gallery", [...form.gallery, url])}
              />
            </div>
          </div>
        )}

        {/* ===== ÔNIBUS ===== */}
        {tab === "onibus" && (
          <div className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Tipo de ônibus">
                <select
                  className={inputClass}
                  value={busModel}
                  onChange={(e) =>
                    setBusConfig(e.target.value as BusModelId, busCount)
                  }
                >
                  {Object.entries(BUS_MODELS).map(([id, m]) => (
                    <option key={id} value={id}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-[11px] text-graphite/45">
                  As plantas seguem os ônibus reais da SITUR.
                </p>
              </Field>
              <Field label="Quantidade de ônibus">
                <select
                  className={inputClass}
                  value={busCount}
                  onChange={(e) => setBusConfig(busModel, Number(e.target.value))}
                >
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "ônibus" : "ônibus"} —{" "}
                      {BUS_MODELS[busModel].seats * n} lugares
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-[11px] text-graphite/45">
                  Trocar tipo/quantidade recalcula as vagas e limpa os bloqueios.
                </p>
              </Field>
            </div>

            <div className="rounded-2xl border border-graphite/10 bg-blush-light/40 p-6">
              <p className="mb-1 text-sm font-bold text-rose-dark">
                Bloquear poltronas
              </p>
              <p className="mb-5 text-xs text-graphite/60">
                Clique nas poltronas já vendidas presencialmente para bloqueá-las
                — assim elas não aparecem disponíveis no site. As vendidas
                online travam sozinhas.{" "}
                <strong className="text-graphite">
                  {(form.blockedSeats ?? []).length} bloqueada(s)
                </strong>
                .
              </p>
              <div className="overflow-x-auto pb-2">
                <BusSeatMap
                  layout={busLayout}
                  active={form.blockedSeats ?? []}
                  occupied={heldSeats}
                  onToggle={toggleBlockedSeat}
                  variant="admin"
                />
              </div>
            </div>
          </div>
        )}

        {/* ===== ROTEIRO ===== */}
        {tab === "roteiro" && (
          <div className="space-y-6">
            {form.itinerary.map((day, di) => (
              <div
                key={di}
                className="rounded-2xl border border-graphite/10 bg-blush-light/40 p-6"
              >
                <div className="mb-5 flex items-center justify-between">
                  <p className="flex items-center gap-2 text-sm font-bold text-rose-dark">
                    <GripVertical size={15} className="text-graphite/30" />
                    Dia {day.day}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={di === 0}
                      onClick={() => {
                        const it = [...form.itinerary];
                        [it[di - 1], it[di]] = [it[di], it[di - 1]];
                        set("itinerary", it.map((d, i) => ({ ...d, day: i + 1 })));
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-graphite/40 hover:bg-white disabled:opacity-30"
                    >
                      <ChevronUp size={15} />
                    </button>
                    <button
                      type="button"
                      disabled={di === form.itinerary.length - 1}
                      onClick={() => {
                        const it = [...form.itinerary];
                        [it[di + 1], it[di]] = [it[di], it[di + 1]];
                        set("itinerary", it.map((d, i) => ({ ...d, day: i + 1 })));
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-graphite/40 hover:bg-white disabled:opacity-30"
                    >
                      <ChevronDown size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        set(
                          "itinerary",
                          form.itinerary
                            .filter((_, i) => i !== di)
                            .map((d, i) => ({ ...d, day: i + 1 }))
                        )
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-graphite/40 transition-colors hover:bg-rose/10 hover:text-rose"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Título do dia">
                    <input
                      className={inputClass}
                      value={day.title}
                      onChange={(e) => setDay(di, { ...day, title: e.target.value })}
                      placeholder="Ex.: Chegada e boas-vindas"
                    />
                  </Field>
                  <Field label="Cidade">
                    <input
                      className={inputClass}
                      value={day.city}
                      onChange={(e) => setDay(di, { ...day, city: e.target.value })}
                      placeholder="Ex.: Blumenau, Santa Catarina"
                    />
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="Descrição do dia">
                      <textarea
                        className={`${inputClass} h-16 resize-none`}
                        value={day.description ?? ""}
                        onChange={(e) =>
                          setDay(di, { ...day, description: e.target.value })
                        }
                      />
                    </Field>
                  </div>
                </div>

                {/* Activities */}
                <div className="mt-5 space-y-3">
                  <p className={labelClass}>Passeios / atividades</p>
                  <button
                    type="button"
                    onClick={() =>
                      setDay(di, {
                        ...day,
                        activities: [{ time: "", title: "" }, ...day.activities],
                      })
                    }
                    className="flex items-center gap-2 rounded-xl border border-dashed border-rose/40 px-4 py-2.5 text-xs font-semibold text-rose transition-colors hover:bg-rose/5"
                  >
                    <Plus size={14} />
                    Adicionar atividade
                  </button>
                  {day.activities.map((act, ai) => (
                    <div
                      key={ai}
                      className="rounded-xl border border-graphite/10 bg-white p-4"
                    >
                      <div className="grid gap-3 md:grid-cols-[110px_1fr_auto]">
                        <input
                          type="time"
                          className={inputClass}
                          value={parseActivityTime(act.time)}
                          onChange={(e) => {
                            const activities = [...day.activities];
                            activities[ai] = { ...act, time: e.target.value };
                            setDay(di, { ...day, activities });
                          }}
                        />
                        <input
                          className={inputClass}
                          value={act.title}
                          onChange={(e) => {
                            const activities = [...day.activities];
                            activities[ai] = { ...act, title: e.target.value };
                            setDay(di, { ...day, activities });
                          }}
                          placeholder="Título da atividade"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setDay(di, {
                              ...day,
                              activities: day.activities.filter((_, j) => j !== ai),
                            })
                          }
                          className="flex h-10 w-10 items-center justify-center rounded-xl text-graphite/40 transition-colors hover:bg-rose/10 hover:text-rose"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <textarea
                        className={`${inputClass} mt-3 h-16 resize-none`}
                        value={act.description ?? ""}
                        onChange={(e) => {
                          const activities = [...day.activities];
                          activities[ai] = { ...act, description: e.target.value };
                          setDay(di, { ...day, activities });
                        }}
                        placeholder="Descrição da atividade"
                      />
                      <div className="mt-3">
                        {act.image && (
                          <div className="relative mb-2 h-24 w-40 overflow-hidden rounded-lg">
                            <Image src={act.image} alt="" fill sizes="160px" className="object-cover" />
                            <button
                              type="button"
                              onClick={() => {
                                const activities = [...day.activities];
                                activities[ai] = { ...act, image: "" };
                                setDay(di, { ...day, activities });
                              }}
                              className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-graphite/70 text-white hover:bg-rose"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                        <ImageUploader
                          label="Foto da atividade (opcional)"
                          onUploaded={(url) => {
                            const activities = [...day.activities];
                            activities[ai] = { ...act, image: url };
                            setDay(di, { ...day, activities });
                          }}
                        />
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            setDay(di, {
                              ...day,
                              activities: sortActivitiesByTime(day.activities),
                            })
                          }
                          className="flex items-center gap-1.5 rounded-lg bg-rose/10 px-3.5 py-2 text-xs font-semibold text-rose-dark transition-colors hover:bg-rose/20"
                        >
                          <Check size={14} />
                          Salvar horário / ordem
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setDay(di, {
                        ...day,
                        activities: [...day.activities, { time: "", title: "" }],
                      })
                    }
                    className="flex items-center gap-2 rounded-xl border border-dashed border-rose/40 px-4 py-2.5 text-xs font-semibold text-rose transition-colors hover:bg-rose/5"
                  >
                    <Plus size={14} />
                    Adicionar atividade
                  </button>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <Field label="Observações do dia">
                    <textarea
                      className={`${inputClass} h-16 resize-none`}
                      value={day.notes ?? ""}
                      onChange={(e) => setDay(di, { ...day, notes: e.target.value })}
                    />
                  </Field>
                  <Field label="Mapa do dia (URL de embed do Google Maps)">
                    <textarea
                      className={`${inputClass} h-16 resize-none`}
                      value={day.mapEmbedUrl ?? ""}
                      onChange={(e) =>
                        setDay(di, { ...day, mapEmbedUrl: e.target.value })
                      }
                      placeholder="https://www.google.com/maps?q=...&output=embed"
                    />
                  </Field>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                set("itinerary", [
                  ...form.itinerary,
                  {
                    day: form.itinerary.length + 1,
                    title: "",
                    city: "",
                    activities: [],
                  },
                ])
              }
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-rose/40 py-4 text-sm font-semibold text-rose transition-colors hover:bg-rose/5"
            >
              <Plus size={17} />
              Adicionar Dia {form.itinerary.length + 1}
            </button>
          </div>
        )}

        {/* ===== DETALHES ===== */}
        {tab === "detalhes" && (
          <div className="space-y-8">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="O que está incluso (um item por linha)">
                <textarea
                  className={`${inputClass} h-44 resize-none`}
                  value={form.included.join("\n")}
                  onChange={(e) =>
                    set(
                      "included",
                      e.target.value.split("\n").filter((l) => l.trim() !== "")
                    )
                  }
                  placeholder={"Transporte executivo\nGuia acompanhante\nSeguro viagem"}
                />
              </Field>
              <Field label="O que não está incluso (um item por linha)">
                <textarea
                  className={`${inputClass} h-44 resize-none`}
                  value={form.notIncluded.join("\n")}
                  onChange={(e) =>
                    set(
                      "notIncluded",
                      e.target.value.split("\n").filter((l) => l.trim() !== "")
                    )
                  }
                  placeholder={"Refeições\nBebidas\nCompras pessoais"}
                />
              </Field>
            </div>

            <div className="rounded-2xl border border-graphite/10 bg-blush-light/40 p-6">
              <p className="mb-4 text-sm font-bold text-rose-dark">Hotel / Hospedagem</p>
              <div className="grid gap-4">
                <Field label="Nome do hotel">
                  <input
                    className={inputClass}
                    value={form.hotel?.name ?? ""}
                    onChange={(e) =>
                      set("hotel", {
                        name: e.target.value,
                        description: form.hotel?.description ?? "",
                        image: form.hotel?.image ?? "",
                      })
                    }
                  />
                </Field>
                <Field label="Descrição">
                  <textarea
                    className={`${inputClass} h-20 resize-none`}
                    value={form.hotel?.description ?? ""}
                    onChange={(e) =>
                      set("hotel", {
                        name: form.hotel?.name ?? "",
                        description: e.target.value,
                        image: form.hotel?.image ?? "",
                      })
                    }
                  />
                </Field>
                {form.hotel?.image && (
                  <div className="relative h-32 w-56 overflow-hidden rounded-xl">
                    <Image src={form.hotel.image} alt="Hotel" fill sizes="224px" className="object-cover" />
                    <button
                      type="button"
                      onClick={() =>
                        set("hotel", {
                          name: form.hotel?.name ?? "",
                          description: form.hotel?.description ?? "",
                          image: "",
                        })
                      }
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-graphite/70 text-white hover:bg-rose"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
                <ImageUploader
                  label="Foto do hotel"
                  onUploaded={(url) =>
                    set("hotel", {
                      name: form.hotel?.name ?? "",
                      description: form.hotel?.description ?? "",
                      image: url,
                    })
                  }
                />
              </div>
            </div>

            <Field label="Mapa da viagem (URL de embed do Google Maps)">
              <input
                className={inputClass}
                value={form.mapEmbedUrl ?? ""}
                onChange={(e) => set("mapEmbedUrl", e.target.value)}
                placeholder="https://www.google.com/maps?q=Blumenau,+SC&output=embed"
              />
            </Field>
          </div>
        )}

        {/* ===== FAQ ===== */}
        {tab === "faq" && (
          <div className="space-y-4">
            {form.faq.map((faq, i) => (
              <div key={i} className="rounded-2xl border border-graphite/10 bg-blush-light/40 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-3">
                    <input
                      className={inputClass}
                      value={faq.question}
                      onChange={(e) => {
                        const list = [...form.faq];
                        list[i] = { ...faq, question: e.target.value };
                        set("faq", list);
                      }}
                      placeholder="Pergunta"
                    />
                    <textarea
                      className={`${inputClass} h-20 resize-none`}
                      value={faq.answer}
                      onChange={(e) => {
                        const list = [...form.faq];
                        list[i] = { ...faq, answer: e.target.value };
                        set("faq", list);
                      }}
                      placeholder="Resposta"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => set("faq", form.faq.filter((_, j) => j !== i))}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-graphite/40 transition-colors hover:bg-rose/10 hover:text-rose"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => set("faq", [...form.faq, { question: "", answer: "" }])}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-rose/40 py-4 text-sm font-semibold text-rose transition-colors hover:bg-rose/5"
            >
              <Plus size={17} />
              Adicionar pergunta
            </button>
          </div>
        )}
      </div>

      {/* Save bar */}
      <div className="sticky bottom-0 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-graphite/8 bg-white/90 px-4 py-4 shadow-lifted backdrop-blur-xl sm:px-6">
        <p className="text-xs text-rose">{error}</p>
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin/viagens")}
            className="rounded-full px-6 py-3 text-sm font-semibold text-graphite/55 transition-colors hover:text-graphite"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="btn-primary disabled:opacity-60"
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            {saving ? "Salvando..." : trip ? "Salvar alterações" : "Criar viagem"}
          </button>
        </div>
      </div>
    </div>
  );
}
