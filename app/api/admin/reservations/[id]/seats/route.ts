import { NextResponse } from "next/server";
import {
  getManualBookings,
  getReservations,
  getTrips,
  updateReservationSeats,
} from "@/lib/db";
import {
  BUS_MODELS,
  occupiedSeatsForTrip,
  seatBusId,
  seatNumber,
  tripFleet,
  validSeatNumbers,
} from "@/lib/bus";
import { withFileLock } from "@/lib/mutex";
import type { SeatChange } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };
type Move = { from: string; to: string };

function parseMoves(value: unknown): Move[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const moves: Move[] = [];
  for (const item of value) {
    const from = (item as { from?: unknown } | null)?.from;
    const to = (item as { to?: unknown } | null)?.to;
    if (typeof from !== "string" || typeof to !== "string") return null;
    if (!from || !to || from === to) return null;
    moves.push({ from, to });
  }
  return moves;
}

/**
 * Troca a poltrona (ou o ônibus) de uma reserva feita pelo site.
 *
 * O corpo só aceita "da poltrona X para a poltrona Y": não há como mandar
 * nome, valor, status ou pagamento por aqui — esses dados da compra ficam
 * exatamente como o cliente deixou. A troca fica registrada em `seatChanges`.
 */
export async function POST(request: Request, { params }: Ctx) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { moves?: unknown } | null;
  const moves = parseMoves(body?.moves);
  if (!moves) {
    return NextResponse.json(
      { error: "Informe de qual poltrona para qual poltrona." },
      { status: 400 }
    );
  }

  // Mesma trava das vendas no balcão e da mudança de frota: enquanto a troca
  // é conferida e gravada, ninguém vende a poltrona de destino nem remove o
  // ônibus dela.
  const result = await withFileLock("manual-bookings", async () => {
    const reservations = await getReservations();
    const reservation = reservations.find((r) => r.id === id);
    if (!reservation) {
      return { error: "Reserva não encontrada", status: 404 as const };
    }
    if (reservation.status !== "approved" && reservation.status !== "pending") {
      return {
        error: "Só dá para trocar a poltrona de uma reserva ativa (aprovada ou aguardando pagamento).",
        status: 409 as const,
      };
    }
    const currentSeats = reservation.seats ?? [];
    if (currentSeats.length === 0) {
      return {
        error: "Essa reserva não tem poltrona marcada.",
        status: 409 as const,
      };
    }

    const trip = (await getTrips()).find((t) => t.id === reservation.tripId);
    if (!trip) {
      return { error: "Viagem não encontrada", status: 404 as const };
    }
    // Texto que fica gravado no histórico: "Ônibus 2 (Executivo 46) · polt. 15"
    // (ou só "polt. 15" em viagem de um ônibus). Leva o tipo do ônibus porque
    // o número é a posição na frota de HOJE e muda se um ônibus for removido
    // depois — o tipo é o que continua identificando de qual ônibus se falava.
    const fleet = tripFleet(trip);
    const label = (seat: string) => {
      const n = seatNumber(seat);
      const index = fleet.findIndex((b) => b.id === seatBusId(seat));
      if (fleet.length <= 1 || index === -1) return `polt. ${n}`;
      return `Ônibus ${index + 1} (${BUS_MODELS[fleet[index].model].short}) · polt. ${n}`;
    };

    const destinationOf = new Map(moves.map((m) => [m.from, m.to]));
    if (
      destinationOf.size !== moves.length ||
      moves.some((m) => !currentSeats.includes(m.from))
    ) {
      return {
        error: "A poltrona de origem não pertence a essa reserva. Recarregue a página e tente de novo.",
        status: 400 as const,
      };
    }

    // As conferências de "existe" e "está livre" valem para as poltronas de
    // DESTINO; as que não estão sendo movidas ficam como estão.
    const newSeats = currentSeats.map((s) => destinationOf.get(s) ?? s);
    const destinations = moves.map((m) => m.to);
    const valid = validSeatNumbers(trip);
    if (
      new Set(newSeats).size !== newSeats.length ||
      destinations.some((s) => !valid.has(s))
    ) {
      return { error: "Poltronas inválidas.", status: 400 as const };
    }

    // Ocupação de todos os outros (demais reservas + balcão + bloqueios).
    const manual = await getManualBookings();
    const occupied = occupiedSeatsForTrip(
      trip,
      reservations.filter((r) => r.id !== id),
      manual
    );
    const taken = destinations.filter((s) => occupied.has(s));
    if (taken.length) {
      return {
        error: `${taken.map(label).join(", ")}: poltrona já ocupada ou bloqueada. Libere-a primeiro ou escolha outra.`,
        status: 409 as const,
      };
    }

    const change: SeatChange = {
      at: new Date().toISOString(),
      from: moves.map((m) => m.from),
      to: moves.map((m) => m.to),
      fromLabel: moves.map((m) => label(m.from)).join(", "),
      toLabel: moves.map((m) => label(m.to)).join(", "),
    };

    const updated = await updateReservationSeats(id, {
      seats: newSeats,
      passengerDetails: reservation.passengerDetails?.map((p) => ({
        ...p,
        seat: destinationOf.get(p.seat) ?? p.seat,
      })),
      seatChanges: [...(reservation.seatChanges ?? []), change],
    });
    return { reservation: updated };
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.reservation);
}
