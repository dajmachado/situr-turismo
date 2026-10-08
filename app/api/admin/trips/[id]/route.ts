import { NextResponse } from "next/server";
import { getTrips, saveTrips, getReservations, getManualBookings } from "@/lib/db";
import {
  findOrphanedSoldSeats,
  fleetValidSeats,
  normalizeBusModel,
  normalizeFleet,
  seatLabel,
  tripFleet,
  uniformFleet,
  type FleetBus,
} from "@/lib/bus";
import { buildManifest } from "@/lib/manifest";
import { withFileLock } from "@/lib/mutex";
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

  let requestedFleet: FleetBus[] | null = null;
  if (body.buses !== undefined) {
    requestedFleet = normalizeFleet(body.buses);
    if (!requestedFleet) {
      return NextResponse.json(
        { error: "Lista de ônibus inválida." },
        { status: 400 }
      );
    }
  }

  // Mesma trava das vendas no balcão: enquanto a frota é conferida e gravada,
  // nenhuma venda nova entra numa poltrona que está deixando de existir.
  const result = await withFileLock("manual-bookings", async () => {
    const trips = await getTrips();
    const index = trips.findIndex((t) => t.id === id);
    if (index === -1) {
      return { error: "Viagem não encontrada", status: 404 as const };
    }

    const current = trips[index];
    const currentFleet = tripFleet(current);

    let newFleet = currentFleet;
    if (requestedFleet) {
      newFleet = requestedFleet;
    } else if (
      !current.buses &&
      (body.busModel !== undefined || body.busCount !== undefined)
    ) {
      // Tela antiga (aba aberta desde antes da frota mista) numa viagem que
      // ainda vale por tipo + quantidade. Se a viagem já tem frota gravada,
      // esses dois campos são ignorados — senão uma aba velha desfaria uma
      // frota mista só por salvar outra coisa.
      newFleet = uniformFleet(
        normalizeBusModel(body.busModel ?? current.busModel),
        Number(body.busCount ?? current.busCount) || 1
      );
    }

    // Qualquer mudança na frota só passa se toda poltrona vendida continuar
    // existindo (ver incidente de 24/07/2026).
    if (JSON.stringify(newFleet) !== JSON.stringify(currentFleet)) {
      const [reservations, manual] = await Promise.all([
        getReservations(),
        getManualBookings(),
      ]);
      const orphaned = findOrphanedSoldSeats(id, newFleet, reservations, manual);
      if (orphaned.length) {
        const busIds = currentFleet.map((b) => b.id);
        const names = new Map(
          buildManifest(current, reservations, manual).rows.map((r) => [
            r.seat,
            r.passengerName,
          ])
        );
        const list = orphaned
          .map((s) => {
            const name = names.get(s);
            return name ? `${seatLabel(s, busIds)} (${name})` : seatLabel(s, busIds);
          })
          .join(", ");
        return {
          error: `Não dá para salvar essa mudança nos ônibus: ${orphaned.length} poltrona(s) vendida(s) ficariam sem lugar — ${list}. Passe esses passageiros para outras poltronas e tente de novo.`,
          status: 409 as const,
        };
      }
    }

    const valid = fleetValidSeats(newFleet);
    const blocked = Array.isArray(body.blockedSeats)
      ? body.blockedSeats
      : (current.blockedSeats ?? []);

    trips[index] = {
      ...current,
      ...body,
      id,
      price: Number(body.price ?? current.price) || 0,
      spotsTotal: Number(body.spotsTotal ?? current.spotsTotal) || 0,
      spotsLeft: Number(body.spotsLeft ?? current.spotsLeft) || 0,
      buses: newFleet,
      busModel: newFleet[0].model,
      busCount: newFleet.length,
      // Bloqueio é só marcação do admin: se a poltrona deixou de existir, cai.
      blockedSeats: blocked.map(String).filter((s) => valid.has(s)),
    };
    await saveTrips(trips);
    return { trip: trips[index] };
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.trip);
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
