import { NextResponse } from "next/server";
import { getTrips, getReservations, getManualBookings } from "@/lib/db";
import {
  BUS_MODELS,
  busLayoutForTrip,
  occupiedSeatsForTrip,
  tripFleet,
  validSeatNumbers,
} from "@/lib/bus";
import { buildManifest } from "@/lib/manifest";

// Lista de embarque unificada (online + balcão) de uma viagem.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tripId = searchParams.get("tripId");
  if (!tripId) {
    return NextResponse.json({ error: "tripId é obrigatório" }, { status: 400 });
  }

  const trip = (await getTrips()).find((t) => t.id === tripId);
  if (!trip) {
    return NextResponse.json({ error: "Viagem não encontrada" }, { status: 404 });
  }

  const [reservations, manual] = await Promise.all([
    getReservations(),
    getManualBookings(),
  ]);

  const fleet = tripFleet(trip);
  const manifest = buildManifest(trip, reservations, manual);
  const valid = validSeatNumbers(trip);

  return NextResponse.json({
    trip: {
      id: trip.id,
      title: trip.title,
      date: trip.date,
      destination: trip.destination,
      slug: trip.slug,
      price: trip.price,
      busCount: fleet.length,
      // Um item por ônibus, na ordem da frota (posição = "Ônibus N" da tela).
      buses: fleet.map((b) => ({
        id: b.id,
        model: b.model,
        label: BUS_MODELS[b.model].label,
        seats: BUS_MODELS[b.model].seats,
      })),
    },
    manifest,
    // Poltronas com passageiro que não existem na frota atual. Não deveria
    // acontecer (o servidor recusa mudanças de frota que causariam isso), mas
    // se acontecer a tela avisa em vez de esconder a pessoa.
    orphanSeats: manifest.rows.map((r) => r.seat).filter((s) => !valid.has(s)),
    layout: busLayoutForTrip(trip),
    occupied: [...occupiedSeatsForTrip(trip, reservations, manual)],
    manualBookings: manual.filter((b) => b.tripId === trip.id),
  });
}
