import type { Trip, Reservation, ManualBooking } from "./types";

export type SeatCell =
  | { type: "seat"; id: string; number: string }
  | { type: "aisle" }
  | { type: "empty" }
  | { type: "feature"; label: string; wide?: boolean };

export type BusDeck = { name: string; rows: SeatCell[][] };
export type BusLayout = { decks: BusDeck[]; totalSeats: number };

export type BusModelId = "dd43" | "exec46";

type RawCell = number | null | { f: string; wide?: boolean };

/** Converte a definição enxuta da planta em células (null = corredor). */
function row(cells: RawCell[], seatId: (n: number) => string): SeatCell[] {
  return cells.map((c) => {
    if (c === null) return { type: "aisle" };
    if (typeof c === "number")
      return { type: "seat", id: seatId(c), number: String(c) };
    return { type: "feature", label: c.f, wide: c.wide };
  });
}

/**
 * Planta 1 — Leito DD "Sandra e Ivonete": 43 lugares em 2 andares.
 * Piso superior 2+1 (poltronas 1–31, com TV/escada/geladeira),
 * piso inferior 2+1 (32–43) com motorista, sofá, banheiro e bagageiro.
 */
function buildDd43(seatId: (n: number) => string): BusDeck[] {
  const upper: SeatCell[][] = [
    row([{ f: "TV", wide: true }, null, { f: "TV" }], seatId),
    row([1, 2, null, 3], seatId),
    row([4, 5, null, 6], seatId),
    row([7, 8, null, { f: "Escada", wide: true }], seatId),
    row([9, 10, null, { f: "Gelad." }], seatId),
    row([11, 12, null, 13], seatId),
    row([14, 15, null, 16], seatId),
    row([17, 18, null, 19], seatId),
    row([20, 21, null, 22], seatId),
    row([23, 24, null, 25], seatId),
    row([26, 27, null, 28], seatId),
    row([29, 30, null, 31], seatId),
  ];
  const lower: SeatCell[][] = [
    row([{ f: "Motorista", wide: true }, null, { f: "Sofá", wide: true }], seatId),
    row([{ f: "Banheiro", wide: true }, null, { f: "Escada", wide: true }], seatId),
    row([32, 33, null, 34], seatId),
    row([35, 36, null, 37], seatId),
    row([38, 39, null, 40], seatId),
    row([41, 42, null, 43], seatId),
    row([{ f: "Bagageiro", wide: true }], seatId),
  ];
  return [
    { name: "Piso superior", rows: upper },
    { name: "Piso inferior", rows: lower },
  ];
}

/**
 * Planta 2 — Executivo: 46 lugares em 1 andar, 2+2
 * (numeração igual à planta impressa: janela/corredor | corredor/janela),
 * com geladeira e banheiro no fundo.
 */
function buildExec46(seatId: (n: number) => string): BusDeck[] {
  const rows: SeatCell[][] = [];
  rows.push(row([{ f: "Motorista", wide: true }, null, { f: "Entrada", wide: true }], seatId));
  for (let i = 0; i < 11; i++) {
    const n = 4 * i + 1;
    rows.push(row([n, n + 1, null, n + 3, n + 2], seatId));
  }
  rows.push(row([45, 46, null, { f: "Gelad." }, { f: "WC" }], seatId));
  return [{ name: "", rows }];
}

export const BUS_MODELS: Record<
  BusModelId,
  { label: string; seats: number; build: (seatId: (n: number) => string) => BusDeck[] }
> = {
  dd43: { label: "Leito DD — 43 lugares (2 andares)", seats: 43, build: buildDd43 },
  exec46: { label: "Executivo — 46 lugares", seats: 46, build: buildExec46 },
};

export function tripBusModel(trip: Trip): BusModelId {
  return trip.busModel === "dd43" ? "dd43" : "exec46";
}

export function tripBusCount(trip: Trip): number {
  return Math.min(6, Math.max(1, Math.floor(trip.busCount ?? 1)));
}

/** Capacidade total da frota da viagem (modelo × quantidade). */
export function tripCapacity(trip: Trip): number {
  return BUS_MODELS[tripBusModel(trip)].seats * tripBusCount(trip);
}

/**
 * Monta a planta completa da viagem. Com 1 ônibus os ids são "15";
 * com 2+ ônibus viram "1-15" (ônibus 1, poltrona 15).
 */
export function generateBusLayout(model: BusModelId, count: number): BusLayout {
  const def = BUS_MODELS[model];
  const buses = Math.min(6, Math.max(1, Math.floor(count) || 1));
  const decks: BusDeck[] = [];

  for (let b = 1; b <= buses; b++) {
    const seatId = (n: number) => (buses > 1 ? `${b}-${n}` : String(n));
    for (const deck of def.build(seatId)) {
      const busName = buses > 1 ? `Ônibus ${b}` : "";
      decks.push({
        name: [busName, deck.name].filter(Boolean).join(" · "),
        rows: deck.rows,
      });
    }
  }

  return { decks, totalSeats: def.seats * buses };
}

export function busLayoutForTrip(trip: Trip): BusLayout {
  return generateBusLayout(tripBusModel(trip), tripBusCount(trip));
}

/** "1-15" → "Ônibus 1 · polt. 15"; "15" → "15". */
export function seatLabel(id: string): string {
  const dash = id.indexOf("-");
  if (dash === -1) return id;
  return `Ônibus ${id.slice(0, dash)} · polt. ${id.slice(dash + 1)}`;
}

export function compareSeatIds(a: string, b: string): number {
  const [ba, na] = a.includes("-") ? a.split("-").map(Number) : [1, Number(a)];
  const [bb, nb] = b.includes("-") ? b.split("-").map(Number) : [1, Number(b)];
  return ba - bb || na - nb;
}

/**
 * Assentos travados por reservas ativas (aprovadas ou pendentes).
 * Reservas pendentes expiradas já chegam como "cancelled" — getReservations()
 * em lib/db.ts faz essa varredura antes de devolver a lista.
 */
export function reservationHeldSeats(
  tripId: string,
  reservations: Reservation[]
): Set<string> {
  const held = new Set<string>();
  for (const r of reservations) {
    if (r.tripId !== tripId || !r.seats?.length) continue;
    if (r.status === "approved" || r.status === "pending") {
      r.seats.forEach((s) => held.add(s));
    }
  }
  return held;
}

/** Assentos ocupados por vendas no balcão desta viagem. */
export function manualHeldSeats(
  tripId: string,
  manualBookings: ManualBooking[]
): Set<string> {
  const held = new Set<string>();
  for (const b of manualBookings) {
    if (b.tripId !== tripId) continue;
    b.seats.forEach((s) => held.add(s));
  }
  return held;
}

/**
 * Todos os assentos indisponíveis: bloqueados manualmente + reservas online
 * ativas + vendas no balcão.
 */
export function occupiedSeatsForTrip(
  trip: Trip,
  reservations: Reservation[],
  manualBookings: ManualBooking[] = []
): Set<string> {
  const occupied = new Set<string>(trip.blockedSeats ?? []);
  for (const s of reservationHeldSeats(trip.id, reservations)) occupied.add(s);
  for (const s of manualHeldSeats(trip.id, manualBookings)) occupied.add(s);
  return occupied;
}

/** Ids de assento válidos da planta (para validação no servidor). */
export function validSeatNumbers(trip: Trip): Set<string> {
  const set = new Set<string>();
  for (const deck of busLayoutForTrip(trip).decks) {
    for (const r of deck.rows) {
      for (const cell of r) {
        if (cell.type === "seat") set.add(cell.id);
      }
    }
  }
  return set;
}
