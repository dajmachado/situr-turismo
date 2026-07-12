"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { whatsappLink } from "@/lib/site-config";

type ReservationSummary = {
  id: string;
  tripTitle: string;
  tripDate: string;
  passengers: number;
  amount: number;
  email: string;
  status: string;
};

type State =
  | { kind: "loading" }
  | { kind: "approved"; reservation: ReservationSummary | null }
  | { kind: "failed" }
  | { kind: "unknown" };

export default function ConfirmationClient() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<State>({ kind: "loading" });

  const orderNsu = searchParams.get("order_nsu");
  const transactionNsu = searchParams.get("transaction_nsu");
  const invoiceSlug = searchParams.get("slug");
  const receiptUrl = searchParams.get("receipt_url");

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (!orderNsu || !transactionNsu) {
        setState({ kind: "unknown" });
        return;
      }
      try {
        const params = new URLSearchParams({
          order_nsu: orderNsu,
          transaction_nsu: transactionNsu,
        });
        if (invoiceSlug) params.set("slug", invoiceSlug);
        const res = await fetch(`/api/checkout/status?${params}`);
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data.paid) {
          setState({ kind: "approved", reservation: data.reservation });
        } else if (res.ok) {
          setState({ kind: "failed" });
        } else {
          setState({ kind: "unknown" });
        }
      } catch {
        if (!cancelled) setState({ kind: "unknown" });
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, [orderNsu, transactionNsu, invoiceSlug]);

  return (
    <section className="container-site max-w-2xl py-20">
      <div className="rounded-[2rem] bg-white p-10 text-center shadow-lifted">
        {state.kind === "loading" && (
          <>
            <Loader2
              size={56}
              className="mx-auto animate-spin text-rose"
              strokeWidth={1.5}
            />
            <h1 className="mt-6 font-[family-name:var(--font-display)] text-2xl font-semibold text-graphite">
              Confirmando seu pagamento...
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-graphite/60">
              Estamos verificando a confirmação junto à InfinitePay. Isso leva
              só alguns segundos.
            </p>
          </>
        )}

        {state.kind === "approved" && (
          <>
            <CheckCircle2
              size={64}
              className="mx-auto text-[#1a9b60]"
              strokeWidth={1.5}
            />
            <h1 className="mt-6 font-[family-name:var(--font-display)] text-3xl font-semibold text-graphite">
              Reserva confirmada!
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-graphite/65">
              Pagamento aprovado
              {state.reservation ? (
                <>
                  {" "}
                  — sua vaga na <strong>{state.reservation.tripTitle}</strong> (
                  {state.reservation.tripDate}) está garantida. Nossa equipe
                  entrará em contato pelo WhatsApp com as orientações de
                  embarque.
                </>
              ) : (
                ". Sua vaga está garantida — nossa equipe entrará em contato com as orientações de embarque."
              )}
            </p>
            {state.reservation && (
              <div className="mx-auto mt-6 max-w-sm rounded-2xl bg-blush-light p-5 text-sm">
                <p className="flex justify-between">
                  <span className="text-graphite/55">Reserva</span>
                  <span className="font-semibold text-graphite">
                    {state.reservation.id}
                  </span>
                </p>
                <p className="mt-2 flex justify-between">
                  <span className="text-graphite/55">Passageiros</span>
                  <span className="font-semibold text-graphite">
                    {state.reservation.passengers}
                  </span>
                </p>
                <p className="mt-2 flex justify-between">
                  <span className="text-graphite/55">Total pago</span>
                  <span className="font-semibold text-graphite">
                    {formatPrice(state.reservation.amount)}
                  </span>
                </p>
              </div>
            )}
            {receiptUrl && (
              <a
                href={receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline mx-auto mt-6"
              >
                <ExternalLink size={15} />
                Ver comprovante
              </a>
            )}
          </>
        )}

        {state.kind === "failed" && (
          <>
            <XCircle size={64} className="mx-auto text-rose" strokeWidth={1.5} />
            <h1 className="mt-6 font-[family-name:var(--font-display)] text-3xl font-semibold text-graphite">
              Pagamento não confirmado
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-graphite/65">
              Ainda não recebemos a confirmação deste pagamento. Se você pagou
              via Pix agora mesmo, aguarde alguns instantes e atualize esta
              página — ou fale com a gente.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary mt-6"
            >
              Verificar novamente
            </button>
          </>
        )}

        {state.kind === "unknown" && (
          <>
            <ShieldCheck
              size={64}
              className="mx-auto text-gold-dark"
              strokeWidth={1.5}
            />
            <h1 className="mt-6 font-[family-name:var(--font-display)] text-3xl font-semibold text-graphite">
              Quase lá!
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-graphite/65">
              Não conseguimos identificar automaticamente o seu pagamento.
              Fale com a nossa equipe que confirmamos sua reserva na hora.
            </p>
          </>
        )}

        <div className="mt-8 border-t border-graphite/8 pt-6">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <Link
              href="/minhas-reservas"
              className="font-semibold text-rose hover:text-rose-dark"
            >
              Minhas Reservas
            </Link>
            <Link
              href="/viagens"
              className="font-semibold text-rose hover:text-rose-dark"
            >
              Ver outras viagens
            </Link>
            <a
              href={whatsappLink(
                orderNsu
                  ? `Olá! Sobre a minha reserva ${orderNsu} — pode me ajudar?`
                  : undefined
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-rose hover:text-rose-dark"
            >
              Falar com a SITUR
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
