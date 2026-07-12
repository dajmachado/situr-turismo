import { NextResponse } from "next/server";
import {
  getTripsWithLiveSpots,
  getReservations,
  saveReservations,
  getManualBookings,
} from "@/lib/db";
import { createCheckoutLink, isPaymentConfigured } from "@/lib/checkout";
import { occupiedSeatsForTrip, validSeatNumbers } from "@/lib/bus";
import { upsertCustomer } from "@/lib/auth";
import { newId } from "@/lib/utils";
import type { Reservation, PassengerDetail } from "@/lib/types";

type CheckoutBody = {
  tripSlug: string;
  seats?: string[];
  passengerDetails?: PassengerDetail[];
  passengers?: number;
  contact: { name: string; email: string; phone: string };
};

export async function POST(request: Request) {
  if (!isPaymentConfigured()) {
    return NextResponse.json(
      { error: "Pagamento online não configurado. Defina INFINITEPAY_HANDLE." },
      { status: 503 }
    );
  }

  const body = (await request.json()) as CheckoutBody;
  const name = body.contact?.name?.trim();
  const email = body.contact?.email?.trim();

  if (!body.tripSlug || !name || !email) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  const trips = await getTripsWithLiveSpots();
  const trip = trips.find((t) => t.slug === body.tripSlug);
  if (!trip) {
    return NextResponse.json({ error: "Viagem não encontrada" }, { status: 404 });
  }

  const seats = (body.seats ?? []).map(String);
  const passengers = seats.length || Math.floor(Number(body.passengers)) || 0;

  if (passengers < 1) {
    return NextResponse.json(
      { error: "Selecione ao menos uma poltrona." },
      { status: 400 }
    );
  }

  // Validação dos assentos: existem na planta e ainda estão livres.
  if (seats.length) {
    const valid = validSeatNumbers(trip);
    const invalid = seats.filter((s) => !valid.has(s));
    if (invalid.length || new Set(seats).size !== seats.length) {
      return NextResponse.json(
        { error: "Seleção de poltronas inválida." },
        { status: 400 }
      );
    }

    const [reservations, manual] = await Promise.all([
      getReservations(),
      getManualBookings(),
    ]);
    const occupied = occupiedSeatsForTrip(trip, reservations, manual);
    const taken = seats.filter((s) => occupied.has(s));
    if (taken.length) {
      return NextResponse.json(
        {
          error: `As poltronas ${taken.join(", ")} acabaram de ser reservadas. Escolha outras.`,
          takenSeats: taken,
        },
        { status: 409 }
      );
    }
  } else if (trip.spotsLeft < passengers) {
    return NextResponse.json(
      { error: `Restam apenas ${trip.spotsLeft} vagas para esta viagem.` },
      { status: 409 }
    );
  }

  // Dados de cada passageiro (primeiro assento assume o comprador se vazio).
  const passengerDetails: PassengerDetail[] = seats.map((seat, i) => {
    const provided = body.passengerDetails?.find((p) => p.seat === seat);
    return {
      seat,
      name: provided?.name?.trim() || (i === 0 ? name : ""),
      document: provided?.document?.trim() || undefined,
    };
  });

  if (passengerDetails.some((p) => !p.name)) {
    return NextResponse.json(
      { error: "Informe o nome de cada passageiro." },
      { status: 400 }
    );
  }

  // O valor é sempre calculado no servidor — nunca confiamos no total do cliente.
  const amount = Number((trip.price * passengers).toFixed(2));

  const reservation: Reservation = {
    id: newId(),
    tripId: trip.id,
    tripSlug: trip.slug,
    tripTitle: trip.title,
    tripDate: trip.date,
    name,
    email,
    phone: body.contact.phone ?? "",
    passengers,
    seats: seats.length ? seats : undefined,
    passengerDetails: passengerDetails.length ? passengerDetails : undefined,
    amount,
    status: "pending",
    spotsCounted: false,
    createdAt: new Date().toISOString(),
  };

  // Todo comprador entra na base de clientes, mesmo sem login
  await upsertCustomer({ name, email, phone: body.contact.phone }).catch(
    () => {}
  );

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    new URL(request.url).origin;

  try {
    const { url, slug } = await createCheckoutLink({
      reservation,
      trip,
      redirectUrl: `${origin}/checkout/${trip.slug}/confirmacao`,
      webhookUrl: process.env.INFINITEPAY_WEBHOOK_URL,
    });

    reservation.checkoutSlug = slug;
    const reservations = await getReservations();
    reservations.push(reservation);
    await saveReservations(reservations);

    return NextResponse.json({
      reservationId: reservation.id,
      checkoutUrl: url,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao iniciar o pagamento";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
