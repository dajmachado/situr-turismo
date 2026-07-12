import { getReservations, saveReservations, getTrips, saveTrips } from "./db";
import { sendReservationConfirmation } from "./notifications";
import type { Reservation, Trip } from "./types";

const API_BASE = "https://api.infinitepay.io/invoices/public/checkout";

export function isPaymentConfigured(): boolean {
  return Boolean(process.env.INFINITEPAY_HANDLE);
}

function getHandle(): string {
  const handle = process.env.INFINITEPAY_HANDLE;
  if (!handle) throw new Error("INFINITEPAY_HANDLE não configurado");
  // Aceita com ou sem o "$" da InfiniteTag
  return handle.replace(/^\$/, "");
}

/**
 * Cria um link de checkout na InfinitePay para a reserva.
 * O preço vai em centavos; o total é quantity × price.
 */
export async function createCheckoutLink(options: {
  reservation: Reservation;
  trip: Trip;
  redirectUrl: string;
  webhookUrl?: string;
}): Promise<{ url: string; slug: string }> {
  const { reservation, trip, redirectUrl, webhookUrl } = options;

  const response = await fetch(`${API_BASE}/links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      handle: getHandle(),
      order_nsu: reservation.id,
      redirect_url: redirectUrl,
      webhook_url: webhookUrl || undefined,
      customer: {
        name: reservation.name,
        email: reservation.email,
        phone_number: reservation.phone || undefined,
      },
      items: [
        {
          quantity: reservation.passengers,
          price: Math.round(trip.price * 100),
          description: `${trip.title} — ${trip.date}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `InfinitePay retornou ${response.status} ao criar o link: ${body.slice(0, 300)}`
    );
  }

  const data = (await response.json()) as { link?: string; url?: string; slug?: string };
  const url = data.link ?? data.url;
  if (!url) {
    throw new Error("InfinitePay não retornou o link de pagamento");
  }
  return { url, slug: data.slug ?? "" };
}

/**
 * Confirma junto à InfinitePay se um pagamento foi realmente pago.
 */
export async function checkPayment(params: {
  orderNsu: string;
  transactionNsu: string;
  slug: string;
}): Promise<{
  paid: boolean;
  amount?: number;
  installments?: number;
  captureMethod?: string;
}> {
  const response = await fetch(`${API_BASE}/payment_check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      handle: getHandle(),
      order_nsu: params.orderNsu,
      transaction_nsu: params.transactionNsu,
      slug: params.slug,
    }),
  });

  if (!response.ok) {
    throw new Error(`InfinitePay retornou ${response.status} no payment_check`);
  }

  const data = (await response.json()) as {
    success?: boolean;
    paid?: boolean;
    amount?: number;
    installments?: number;
    capture_method?: string;
  };

  return {
    paid: Boolean(data.success && data.paid),
    amount: data.amount,
    installments: data.installments,
    captureMethod: data.capture_method,
  };
}

/**
 * Atualiza a reserva após a confirmação do pagamento.
 * Ao aprovar, desconta as vagas da viagem uma única vez (spotsCounted).
 */
export async function applyPaymentToReservation(update: {
  reservationId: string;
  paid: boolean;
  transactionNsu?: string;
  checkoutSlug?: string;
  captureMethod?: string;
}): Promise<Reservation | null> {
  const reservations = await getReservations();
  const index = reservations.findIndex((r) => r.id === update.reservationId);
  if (index === -1) return null;

  const reservation = reservations[index];

  if (update.transactionNsu) reservation.transactionId = update.transactionNsu;
  if (update.checkoutSlug) reservation.checkoutSlug = update.checkoutSlug;
  if (update.captureMethod) reservation.paymentMethod = update.captureMethod;

  if (update.paid) {
    const isFirstApproval = !reservation.spotsCounted;
    reservation.status = "approved";
    if (isFirstApproval) {
      const trips = await getTrips();
      const trip = trips.find((t) => t.id === reservation.tripId);
      if (trip) {
        trip.spotsLeft = Math.max(0, trip.spotsLeft - reservation.passengers);
        await saveTrips(trips);
      }
      reservation.spotsCounted = true;
    }

    reservations[index] = reservation;
    await saveReservations(reservations);

    // Confirmação por e-mail/WhatsApp — só na primeira vez que é aprovada
    if (isFirstApproval) {
      sendReservationConfirmation({
        name: reservation.name,
        email: reservation.email,
        phone: reservation.phone,
        tripTitle: reservation.tripTitle,
        tripDate: reservation.tripDate,
        seats: reservation.seats,
        passengers: reservation.passengers,
        amount: reservation.amount,
        reference: reservation.id,
      }).catch(() => {});
    }

    return reservation;
  }

  reservations[index] = reservation;
  await saveReservations(reservations);
  return reservation;
}
