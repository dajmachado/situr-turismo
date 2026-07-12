"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  CreditCard,
  Calendar,
  Users,
  Armchair,
  ArrowLeft,
  ArrowRight,
  Loader2,
  QrCode,
} from "lucide-react";
import type { Trip } from "@/lib/types";
import { compareSeatIds, seatLabel, type BusLayout } from "@/lib/bus";
import { formatPrice } from "@/lib/utils";
import { whatsappLink } from "@/lib/site-config";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import PhoneInput from "@/components/PhoneInput";
import BusSeatMap from "./BusSeatMap";

const inputClass =
  "w-full rounded-xl border border-graphite/15 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-rose";
const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-graphite/55";

const MAX_SEATS = 10;

type Step = "assentos" | "dados" | "pagamento";
type PassengerData = { name: string; document: string };

function SecurityBadges() {
  return (
    <div className="space-y-3 rounded-2xl border border-gold/25 bg-gold/8 p-5">
      <p className="flex items-center gap-2.5 text-xs font-semibold text-graphite">
        <ShieldCheck size={16} className="shrink-0 text-[#00c46b]" />
        Compre com segurança — pagamento via InfinitePay
      </p>
      <p className="flex items-center gap-2.5 text-xs text-graphite/65">
        <Lock size={16} className="shrink-0 text-gold-dark" />
        Ambiente criptografado — seus dados não passam pela SITUR
      </p>
      <p className="flex items-center gap-2.5 text-xs text-graphite/65">
        <CreditCard size={16} className="shrink-0 text-gold-dark" />
        Cartão em até 12x ou Pix com aprovação na hora
      </p>
    </div>
  );
}

export default function CheckoutClient({
  trip,
  paymentEnabled,
}: {
  trip: Trip;
  paymentEnabled: boolean;
}) {
  const [step, setStep] = useState<Step>("assentos");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loggedEmail, setLoggedEmail] = useState("");
  const [formError, setFormError] = useState("");

  const [layout, setLayout] = useState<BusLayout | null>(null);
  const [occupied, setOccupied] = useState<string[]>([]);
  const [seatsLoading, setSeatsLoading] = useState(true);
  const [seatsError, setSeatsError] = useState("");
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [passengers, setPassengers] = useState<Record<string, PassengerData>>({});
  const [seatStepError, setSeatStepError] = useState("");

  const [payError, setPayError] = useState("");
  const [redirecting, setRedirecting] = useState(false);

  const sortedSeats = useMemo(
    () => [...selectedSeats].sort(compareSeatIds),
    [selectedSeats]
  );
  const amount = useMemo(
    () => Number((trip.price * selectedSeats.length).toFixed(2)),
    [trip.price, selectedSeats.length]
  );
  const available = layout ? layout.totalSeats - occupied.length : trip.spotsLeft;

  async function loadSeats() {
    setSeatsLoading(true);
    setSeatsError("");
    try {
      const res = await fetch(`/api/checkout/seats?tripSlug=${trip.slug}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLayout(data.layout);
      setOccupied(data.occupied);
    } catch {
      setSeatsError("Não foi possível carregar o mapa de poltronas.");
    } finally {
      setSeatsLoading(false);
    }
  }

  // Carrega o mapa de poltronas já na abertura (1º passo)
  useEffect(() => {
    loadSeats();
    // Login com Google preenche os dados do comprador automaticamente
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setLoggedEmail(data.user.email);
          setName((v) => v || data.user.name);
          setEmail((v) => v || data.user.email);
          setPhone((v) => v || data.user.phone);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mantém o 1º passageiro sincronizado com o nome do comprador
  function setBuyerName(value: string) {
    setPassengers((p) => {
      const first = sortedSeats[0];
      if (first && (!p[first]?.name || p[first]?.name === name)) {
        return { ...p, [first]: { name: value, document: p[first]?.document ?? "" } };
      }
      return p;
    });
    setName(value);
  }

  function toggleSeat(seat: string) {
    setSeatStepError("");
    setSelectedSeats((prev) => {
      if (prev.includes(seat)) {
        setPassengers((p) => {
          const next = { ...p };
          delete next[seat];
          return next;
        });
        return prev.filter((s) => s !== seat);
      }
      if (prev.length >= MAX_SEATS) {
        setSeatStepError(`Máximo de ${MAX_SEATS} poltronas por reserva.`);
        return prev;
      }
      setPassengers((p) => ({
        ...p,
        [seat]: { name: prev.length === 0 ? name : "", document: "" },
      }));
      return [...prev, seat];
    });
  }

  function continueToData() {
    if (selectedSeats.length === 0) {
      setSeatStepError("Escolha ao menos uma poltrona.");
      return;
    }
    setSeatStepError("");
    // Garante que o 1º passageiro comece com o nome do comprador (se houver)
    const first = sortedSeats[0];
    if (first && !passengers[first]?.name && name) {
      setPassengers((p) => ({
        ...p,
        [first]: { name, document: p[first]?.document ?? "" },
      }));
    }
    setStep("dados");
  }

  function continueToPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setFormError("Preencha nome e e-mail para continuar.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setFormError("Informe um e-mail válido.");
      return;
    }
    if (sortedSeats.some((s) => !passengers[s]?.name.trim())) {
      setFormError("Informe o nome de cada passageiro.");
      return;
    }
    setFormError("");
    setStep("pagamento");
  }

  async function goToPayment() {
    setRedirecting(true);
    setPayError("");
    try {
      const res = await fetch("/api/checkout/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripSlug: trip.slug,
          seats: sortedSeats,
          passengerDetails: sortedSeats.map((seat) => ({
            seat,
            name: passengers[seat]?.name.trim() ?? "",
            document: passengers[seat]?.document.trim() || undefined,
          })),
          contact: { name, email, phone },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 && Array.isArray(data.takenSeats)) {
          setSelectedSeats((prev) =>
            prev.filter((s) => !data.takenSeats.includes(s))
          );
          await loadSeats();
          setStep("assentos");
          setSeatStepError(data.error);
          setRedirecting(false);
          return;
        }
        throw new Error(data.error ?? "Erro ao iniciar o pagamento");
      }
      window.location.href = data.checkoutUrl;
    } catch (error) {
      setPayError(
        error instanceof Error
          ? error.message
          : "Erro ao iniciar o pagamento. Tente novamente."
      );
      setRedirecting(false);
    }
  }

  const steps: { id: Step; label: string }[] = [
    { id: "assentos", label: "1. Poltronas" },
    { id: "dados", label: "2. Passageiros" },
    { id: "pagamento", label: "3. Pagamento" },
  ];
  const stepIndex = steps.findIndex((s) => s.id === step);

  return (
    <section className="container-site py-16">
      <Link
        href={`/viagens/${trip.slug}`}
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-graphite/60 transition-colors hover:text-rose-dark"
      >
        <ArrowLeft size={15} />
        Voltar para a viagem
      </Link>

      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          <p className="section-label">Reserva online</p>
          <h1 className="heading-display !text-3xl">
            {step === "assentos"
              ? "Escolha as poltronas"
              : step === "dados"
                ? "Dados dos passageiros"
                : "Revise e pague com segurança"}
          </h1>

          {/* Steps indicator */}
          <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-semibold">
            {steps.map((s, i) => (
              <span key={s.id} className="flex items-center gap-2">
                <span
                  className={`rounded-full px-4 py-2 ${
                    i === stepIndex
                      ? "bg-rose text-white"
                      : i < stepIndex
                        ? "bg-blush text-rose-dark"
                        : "bg-white text-graphite/45 shadow-soft"
                  }`}
                >
                  {s.label}
                </span>
                {i < steps.length - 1 && (
                  <span className="h-px w-4 bg-graphite/20" />
                )}
              </span>
            ))}
          </div>

          {/* ===== STEP 1: ASSENTOS ===== */}
          {step === "assentos" && (
            <div className="mt-8">
              <div className="rounded-3xl bg-white p-6 shadow-soft sm:p-8">
                {seatsLoading ? (
                  <p className="flex items-center gap-2 py-10 text-sm text-graphite/55">
                    <Loader2 size={16} className="animate-spin" />
                    Carregando o mapa do ônibus...
                  </p>
                ) : seatsError ? (
                  <div className="py-6">
                    <p className="text-sm text-rose">{seatsError}</p>
                    <button onClick={loadSeats} className="btn-outline mt-4">
                      Tentar novamente
                    </button>
                  </div>
                ) : layout ? (
                  <>
                    <p className="mb-1 text-sm text-graphite/65">
                      Clique nas poltronas que deseja reservar.{" "}
                      <strong className="text-graphite">{available}</strong>{" "}
                      {available === 1 ? "disponível" : "disponíveis"}.
                    </p>
                    <div className="mt-5 overflow-x-auto pb-2">
                      <BusSeatMap
                        layout={layout}
                        active={selectedSeats}
                        occupied={occupied}
                        onToggle={toggleSeat}
                      />
                    </div>

                    {sortedSeats.length > 0 && (
                      <div className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl bg-blush-light p-4 text-sm">
                        <Armchair size={16} className="text-rose" />
                        <span className="font-semibold text-graphite">
                          {sortedSeats.length}{" "}
                          {sortedSeats.length === 1 ? "poltrona" : "poltronas"}:
                        </span>
                        <span className="text-graphite/70">
                          {sortedSeats.map((s) => s.split("-").pop()).join(", ")}
                        </span>
                        <span className="ml-auto font-[family-name:var(--font-display)] text-lg font-semibold text-graphite">
                          {formatPrice(amount)}
                        </span>
                      </div>
                    )}

                    {seatStepError && (
                      <p className="mt-4 text-xs text-rose">{seatStepError}</p>
                    )}
                    <button
                      onClick={continueToData}
                      disabled={selectedSeats.length === 0}
                      className="btn-primary mt-6 w-full disabled:opacity-50"
                    >
                      Continuar
                      <ArrowRight size={16} />
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          )}

          {/* ===== STEP 2: DADOS ===== */}
          {step === "dados" && (
            <form onSubmit={continueToPayment} className="mt-8">
              <button
                type="button"
                onClick={() => setStep("assentos")}
                className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-graphite/55 transition-colors hover:text-rose-dark"
              >
                <ArrowLeft size={13} />
                Alterar poltronas ({sortedSeats.map((s) => s.split("-").pop()).join(", ")})
              </button>

              <div className="space-y-5 rounded-3xl bg-white p-8 shadow-soft">
                {!loggedEmail && process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
                  <div className="rounded-2xl bg-blush-light p-5">
                    <p className="mb-3 text-sm font-semibold text-graphite">
                      Já viajou com a gente? Entre e preenchemos tudo para você:
                    </p>
                    <GoogleLoginButton
                      onLogin={(user) => {
                        setLoggedEmail(user.email);
                        setBuyerName(user.name);
                        setEmail(user.email);
                        if (user.phone) setPhone(user.phone);
                      }}
                    />
                  </div>
                )}
                {loggedEmail && (
                  <p className="rounded-2xl bg-blush-light px-5 py-3 text-xs text-graphite/65">
                    Conectado como <strong>{loggedEmail}</strong>.
                  </p>
                )}

                <p className="text-xs font-semibold uppercase tracking-wider text-graphite/45">
                  Responsável pela reserva
                </p>
                <div>
                  <label className={labelClass}>Nome completo *</label>
                  <input
                    className={inputClass}
                    value={name}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Quem está reservando"
                  />
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>E-mail *</label>
                    <input
                      type="email"
                      className={inputClass}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="voce@email.com"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>WhatsApp / Telefone</label>
                    <PhoneInput className={inputClass} value={phone} onChange={setPhone} />
                  </div>
                </div>

                <div className="border-t border-graphite/8 pt-5">
                  <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-graphite">
                    <Users size={15} className="text-rose" />
                    {sortedSeats.length === 1
                      ? "Passageiro"
                      : `Passageiros (${sortedSeats.length})`}
                  </p>
                  <div className="space-y-4">
                    {sortedSeats.map((seat, i) => (
                      <div
                        key={seat}
                        className="rounded-2xl border border-graphite/10 bg-blush-light/40 p-4"
                      >
                        <div className="mb-3 flex items-center gap-2">
                          <span className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-rose px-2 text-xs font-bold text-white">
                            {seat.split("-").pop()}
                          </span>
                          <span className="text-xs font-semibold uppercase tracking-wider text-graphite/55">
                            {seat.includes("-") ? seatLabel(seat) : `Poltrona ${seat}`}
                            {i === 0 && " · responsável"}
                          </span>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <input
                            className={inputClass}
                            value={passengers[seat]?.name ?? ""}
                            onChange={(e) =>
                              setPassengers((p) => ({
                                ...p,
                                [seat]: {
                                  name: e.target.value,
                                  document: p[seat]?.document ?? "",
                                },
                              }))
                            }
                            placeholder="Nome completo do passageiro"
                          />
                          <input
                            className={inputClass}
                            value={passengers[seat]?.document ?? ""}
                            onChange={(e) =>
                              setPassengers((p) => ({
                                ...p,
                                [seat]: {
                                  name: p[seat]?.name ?? "",
                                  document: e.target.value,
                                },
                              }))
                            }
                            placeholder="Documento (RG/CPF) — opcional"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {formError && <p className="text-xs text-rose">{formError}</p>}
                <button type="submit" className="btn-primary w-full">
                  Ir para o pagamento
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* ===== STEP 3: PAGAMENTO ===== */}
          {step === "pagamento" && (
            <div className="mt-8">
              <button
                onClick={() => setStep("dados")}
                className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-graphite/55 transition-colors hover:text-rose-dark"
              >
                <ArrowLeft size={13} />
                Revisar dados
              </button>

              {paymentEnabled ? (
                <div className="rounded-3xl bg-white p-8 shadow-soft">
                  <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-graphite">
                    Tudo certo, {name.split(" ")[0]}?
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-graphite/65">
                    Você será levado ao ambiente de pagamento seguro da{" "}
                    <strong>InfinitePay</strong> para concluir a reserva — e
                    volta para o site da SITUR com a confirmação na tela.
                  </p>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-3 rounded-2xl bg-blush-light p-4">
                      <QrCode size={22} className="shrink-0 text-rose-dark" />
                      <div>
                        <p className="text-sm font-semibold text-graphite">Pix</p>
                        <p className="text-xs text-graphite/55">Aprovação na hora</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl bg-blush-light p-4">
                      <CreditCard size={22} className="shrink-0 text-rose-dark" />
                      <div>
                        <p className="text-sm font-semibold text-graphite">
                          Cartão de crédito
                        </p>
                        <p className="text-xs text-graphite/55">Em até 12x</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={goToPayment}
                    disabled={redirecting}
                    className="btn-primary mt-7 w-full disabled:opacity-60"
                  >
                    {redirecting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Preparando pagamento seguro...
                      </>
                    ) : (
                      <>
                        <Lock size={15} />
                        Pagar {formatPrice(amount)} com segurança
                      </>
                    )}
                  </button>
                  {payError && <p className="mt-3 text-xs text-rose">{payError}</p>}
                  <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-graphite/45">
                    <ShieldCheck size={13} className="text-[#00c46b]" />
                    Processado pela InfinitePay — a SITUR não vê os dados do seu
                    cartão
                  </p>
                </div>
              ) : (
                <div className="rounded-3xl border border-gold/30 bg-gold/8 p-8">
                  <p className="font-semibold text-graphite">
                    Pagamento online em ativação
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-graphite/65">
                    Estamos finalizando a integração com a InfinitePay.
                    Enquanto isso, reserve suas poltronas pelo WhatsApp — é
                    rápido e sua prioridade fica garantida.
                  </p>
                  <a
                    href={whatsappLink(
                      `Olá! Quero reservar as poltronas ${sortedSeats
                        .map(seatLabel)
                        .join(", ")} na ${trip.title} (${trip.date}) em nome de ${name}.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary mt-5"
                  >
                    Reservar pelo WhatsApp
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Resumo do pedido */}
        <aside>
          <div className="sticky top-28 space-y-5">
            <div className="overflow-hidden rounded-3xl bg-white shadow-soft">
              <div className="relative h-40">
                <Image
                  src={trip.coverImage}
                  alt={trip.title}
                  fill
                  sizes="380px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-graphite/70 to-transparent" />
                <p className="absolute bottom-4 left-5 right-5 font-[family-name:var(--font-display)] text-lg font-semibold text-white">
                  {trip.title}
                </p>
              </div>
              <div className="space-y-3 p-6 text-sm">
                <p className="flex items-center justify-between text-graphite/65">
                  <span className="flex items-center gap-2">
                    <Calendar size={14} className="text-gold-dark" />
                    Saída
                  </span>
                  <span className="font-semibold text-graphite">{trip.date}</span>
                </p>
                <p className="flex items-center justify-between text-graphite/65">
                  <span className="flex items-center gap-2">
                    <Armchair size={14} className="text-gold-dark" />
                    Poltronas
                  </span>
                  <span className="font-semibold text-graphite">
                    {sortedSeats.length
                      ? sortedSeats.map((s) => s.split("-").pop()).join(", ")
                      : "—"}
                  </span>
                </p>
                <p className="flex items-center justify-between text-graphite/65">
                  <span>
                    {formatPrice(trip.price)} × {selectedSeats.length}
                  </span>
                  <span className="font-semibold text-graphite">
                    {formatPrice(amount)}
                  </span>
                </p>
                <div className="flex items-center justify-between border-t border-graphite/8 pt-4">
                  <span className="text-xs uppercase tracking-wider text-graphite/50">
                    Total
                  </span>
                  <span className="font-[family-name:var(--font-display)] text-2xl font-semibold text-graphite">
                    {formatPrice(amount)}
                  </span>
                </div>
                <p className="text-right text-[11px] text-gold-dark">
                  Pix ou cartão em até 12x
                </p>
              </div>
            </div>

            <SecurityBadges />
          </div>
        </aside>
      </div>
    </section>
  );
}
