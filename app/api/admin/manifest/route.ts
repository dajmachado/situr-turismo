import { NextResponse } from "next/server";
import { getTrips, getReservations, getManualBookings } from "@/lib/db";
import { busLayoutForTrip, occupiedSeatsForTrip } from "@/lib/bus";
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

  return NextResponse.json({
    trip: {
      id: trip.id,
      title: trip.title,
      date: trip.date,
      destination: trip.destination,
      slug: trip.slug,
      price: trip.price,
    },
    manifest: buildManifest(trip, reservations, manual),
    layout: busLayoutForTrip(trip),
    occupied: [...occupiedSeatsForTrip(trip, reservations, manual)],
    manualBookings: manual.filter((b) => b.tripId === trip.id),
  });
}
