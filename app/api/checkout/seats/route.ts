import { NextResponse } from "next/server";
import { getTrips, getReservations, getManualBookings } from "@/lib/db";
import {
  busLayoutForTrip,
  occupiedSeatsForTrip,
  reservationHeldSeats,
  manualHeldSeats,
} from "@/lib/bus";

// Retorna a planta do ônibus e os assentos indisponíveis de uma viagem.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tripSlug = searchParams.get("tripSlug");
  if (!tripSlug) {
    return NextResponse.json({ error: "tripSlug é obrigatório" }, { status: 400 });
  }

  const trip = (await getTrips()).find((t) => t.slug === tripSlug);
  if (!trip) {
    return NextResponse.json({ error: "Viagem não encontrada" }, { status: 404 });
  }

  const [reservations, manual] = await Promise.all([
    getReservations(),
    getManualBookings(),
  ]);
  const occupied = [...occupiedSeatsForTrip(trip, reservations, manual)];
  // "held" = vendidos (online + balcão), separado dos bloqueios manuais
  const held = [
    ...new Set([
      ...reservationHeldSeats(trip.id, reservations),
      ...manualHeldSeats(trip.id, manual),
    ]),
  ];

  return NextResponse.json({
    layout: busLayoutForTrip(trip),
    occupied,
    held,
    price: trip.price,
  });
}
