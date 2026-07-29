import { NextResponse } from "next/server";
import { getTrips, saveTrips, getReservations, getManualBookings } from "@/lib/db";
import { findOrphanedOccupiedSeats, seatLabel, type BusModelId } from "@/lib/bus";
import type { Trip } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const trip = (await getTrips()).find((t) => t.id === id);
  if (!trip) {
    return NextResponse.json({ error: "Viagem não encontrada" }, { status: 404 });
  }
  return NextResponse.json(trip);
}

export async function PUT(request: Request, { params }: Ctx) {
  const { id } = await params;
  const body = (await request.json()) as Partial<Trip>;
  const trips = await getTrips();
  const index = trips.findIndex((t) => t.id === id);
  if (index === -1) {
    return NextResponse.json({ error: "Viagem não encontrada" }, { status: 404 });
  }

  const current = trips[index];
  const newBusModel: BusModelId =
    body.busModel !== undefined
      ? body.busModel === "dd43"
        ? "dd43"
        : "exec46"
      : current.busModel === "dd43"
        ? "dd43"
        : "exec46";
  const newBusCount =
    body.busCount !== undefined ? Number(body.busCount) || 1 : (current.busCount ?? 1);

  // Trocar tipo/quantidade de ônibus pode renumerar poltronas — bloqueia se
  // isso deixaria alguma venda/reserva já feita sem correspondência no novo
  // mapa (ver incidente de 24/07/2026).
  const busConfigChanged =
    newBusModel !== (current.busModel ?? "exec46") ||
    newBusCount !== (current.busCount ?? 1);

  if (busConfigChanged) {
    const [reservations, manual] = await Promise.all([
      getReservations(),
      getManualBookings(),
    ]);
    const orphaned = findOrphanedOccupiedSeats(
      current,
      newBusModel,
      newBusCount,
      reservations,
      manual
    );
    if (orphaned.length) {
      return NextResponse.json(
        {
          error: `Essa troca de ônibus deixaria ${orphaned.length} poltrona(s) ocupada(s) sem correspondência no novo mapa: ${orphaned
            .map(seatLabel)
            .join(", ")}. Reatribua ou cancele essas vendas antes de trocar o ônibus.`,
        },
        { status: 409 }
      );
    }
  }

  trips[index] = {
    ...current,
    ...body,
    id,
    price: Number(body.price ?? current.price) || 0,
    spotsTotal: Number(body.spotsTotal ?? current.spotsTotal) || 0,
    spotsLeft: Number(body.spotsLeft ?? current.spotsLeft) || 0,
  };
  await saveTrips(trips);
  return NextResponse.json(trips[index]);
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const trips = await getTrips();
  const filtered = trips.filter((t) => t.id !== id);
  if (filtered.length === trips.length) {
    return NextResponse.json({ error: "Viagem não encontrada" }, { status: 404 });
  }
  await saveTrips(filtered);
  return NextResponse.json({ ok: true });
}
