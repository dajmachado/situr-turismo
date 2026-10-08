import type { Trip, Reservation, ManualBooking } from "./types";

export type SeatCell =
  | { type: "seat"; id: string; number: string }
  | { type: "aisle" }
  | { type: "empty" }
  // `width` (px) só pra quando o item não cabe nos dois tamanhos padrão
  // (1 poltrona / 2 poltronas) — ex.: geladeira no fim do corredor.
  | { type: "feature"; label: string; wide?: boolean; width?: number };

export type BusDeck = { name: string; rows: SeatCell[][]; busId: number };
export type BusLayout = {
  decks: BusDeck[];
  totalSeats: number;
  /** Ids dos ônibus na ordem da frota — a posição aqui é o "Ônibus N" da tela. */
  busIds: number[];
};

export type BusModelId = "dd43" | "exec46" | "micro24";

/**
 * Um ônibus da frota de uma viagem. O `id` é a identidade FIXA dele: entra
 * no id das poltronas ("3-15" = ônibus de id 3, poltrona 15; o de id 1 usa
 * só "15") e nunca muda nem é reaproveitado por outro ônibus com gente
 * dentro. O número que aparece na tela ("Ônibus 2") NÃO é o id — é a posição
 * na lista. Assim, tirar um ônibus do meio só encurta a lista: os seguintes
 * "sobem" de número sozinhos e nenhuma venda/reserva precisa ser reescrita.
 */
export type FleetBus = { id: number; model: BusModelId };

export const MAX_BUSES = 6;

type RawCell = number | null | { f: string; wide?: boolean; width?: number };

/** Converte a definição enxuta da planta em células (null = corredor). */
function row(cells: RawCell[], seatId: (n: number) => string): SeatCell[] {
  return cells.map((c) => {
    if (c === null) return { type: "aisle" };
    if (typeof c === "number")
      return { type: "seat", id: seatId(c), number: String(c) };
    return { type: "feature", label: c.f, wide: c.wide, width: c.width };
  });
}

/**
 * Planta 1 — Leito DD "Sandra e Ivonete": 43 lugares em 2 andares.
 * Piso superior 2+1 (poltronas 1–31, com TV/escada/geladeira),
 * piso inferior 2+1 (32–43) com motorista, sofá, banheiro e bagageiro.
 */
function buildDd43(seatId: (n: number) => string): DeckPlan[] {
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
function buildExec46(seatId: (n: number) => string): DeckPlan[] {
  const rows: SeatCell[][] = [];
  rows.push(row([{ f: "Motorista", wide: true }, null, { f: "Entrada", wide: true }], seatId));
  for (let i = 0; i < 11; i++) {
    const n = 4 * i + 1;
    rows.push(row([n, n + 1, null, n + 3, n + 2], seatId));
  }
  rows.push(row([45, 46, null, { f: "Gelad." }, { f: "WC" }], seatId));
  return [{ name: "", rows }];
}

/**
 * Planta 3 — Micro-ônibus (Marcopolo Sênior): 24 lugares em 1 andar, 2+2.
 * Numeração igual à planta impressa: na esquerda o PAR fica na janela
 * (02 | 01), na direita o ímpar fica no corredor (05 | 06). A 1ª fileira só
 * existe do lado esquerdo — do direito fica a porta. No fundo, geladeira no
 * fim do corredor e WC no lugar das duas últimas poltronas da direita.
 */
function buildMicro24(seatId: (n: number) => string): DeckPlan[] {
  const rows: SeatCell[][] = [];
  rows.push(row([{ f: "Motorista", wide: true }, null, { f: "Guia", wide: true }], seatId));
  rows.push(row([2, 1, null, { f: "Entrada", wide: true }], seatId));
  for (let i = 0; i < 5; i++) {
    const n = 4 * i + 3;
    rows.push(row([n + 1, n, null, n + 2, n + 3], seatId));
  }
  // Geladeira (36) + WC (64) ocupam exatamente corredor + 2 poltronas (108px
  // com os espaçamentos), então a fileira fecha alinhada com as de cima.
  rows.push(row([24, 23, { f: "Gelad." }, { f: "WC", width: 64 }], seatId));
  return [{ name: "", rows }];
}

type DeckPlan = { name: string; rows: SeatCell[][] };

export const BUS_MODELS: Record<
  BusModelId,
  {
    label: string;
    /** Nome curto, pra identificar o ônibus quando a frota mistura tipos. */
    short: string;
    seats: number;
    build: (seatId: (n: number) => string) => DeckPlan[];
  }
> = {
  dd43: { label: "Leito DD — 43 lugares (2 andares)", short: "Leito DD 43", seats: 43, build: buildDd43 },
  exec46: { label: "Executivo — 46 lugares", short: "Executivo 46", seats: 46, build: buildExec46 },
  micro24: { label: "Micro-ônibus — 24 lugares", short: "Micro 24", seats: 24, build: buildMicro24 },
};

/**
 * Qualquer valor desconhecido/ausente cai no Executivo 46 (padrão histórico).
 * Ponto único dessa decisão — antes ficava espalhada em comparações com
 * "dd43", e um modelo novo viraria Executivo 46 sem ninguém perceber.
 */
export function normalizeBusModel(value: unknown): BusModelId {
  return typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(BUS_MODELS, value)
    ? (value as BusModelId)
    : "exec46";
}

function isBusModel(value: unknown): value is BusModelId {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(BUS_MODELS, value)
  );
}

// ---------------------------------------------------------------------------
// Ids de poltrona. Ônibus de id 1 → "15"; id 2 em diante → "2-15".
// ---------------------------------------------------------------------------

/** Id (fixo) do ônibus a que a poltrona pertence: "15" → 1, "3-15" → 3. */
export function seatBusId(seat: string): number {
  const dash = seat.indexOf("-");
  return dash === -1 ? 1 : Number(seat.slice(0, dash)) || 1;
}

/** Só o número da poltrona dentro do ônibus: "3-15" → "15". */
export function seatNumber(seat: string): string {
  const dash = seat.indexOf("-");
  return dash === -1 ? seat : seat.slice(dash + 1);
}

function makeSeatId(busId: number, n: number): string {
  return busId === 1 ? String(n) : `${busId}-${n}`;
}

export function compareSeatIds(a: string, b: string): number {
  return seatBusId(a) - seatBusId(b) || Number(seatNumber(a)) - Number(seatNumber(b));
}

// ---------------------------------------------------------------------------
// Frota da viagem
// ---------------------------------------------------------------------------

/** N ônibus iguais, com ids 1..N (como toda viagem era antes da frota mista). */
export function uniformFleet(model: BusModelId, count: number): FleetBus[] {
  const n = Math.min(MAX_BUSES, Math.max(1, Math.floor(count) || 1));
  return Array.from({ length: n }, (_, i) => ({ id: i + 1, model }));
}

/**
 * Valida uma frota vinda de fora (banco ou API). Devolve `null` se tiver
 * qualquer coisa estranha — id repetido/inválido, tipo de ônibus desconhecido,
 * lista vazia — em vez de "consertar" em silêncio. Sempre ordenada por id.
 */
export function normalizeFleet(value: unknown): FleetBus[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_BUSES) {
    return null;
  }
  const seen = new Set<number>();
  const fleet: FleetBus[] = [];
  for (const item of value) {
    const id = Number((item as { id?: unknown } | null)?.id);
    const model = (item as { model?: unknown } | null)?.model;
    if (!Number.isInteger(id) || id < 1 || id > 999 || seen.has(id)) return null;
    if (!isBusModel(model)) return null;
    seen.add(id);
    fleet.push({ id, model });
  }
  return fleet.sort((a, b) => a.id - b.id);
}

/**
 * Frota da viagem. Viagens antigas (ou criadas com ônibus iguais) não têm
 * `buses` gravado: aí vale o par tipo + quantidade de sempre, com ids 1..N —
 * exatamente o que essas viagens já usavam.
 */
export function tripFleet(trip: Pick<Trip, "buses" | "busModel" | "busCount">): FleetBus[] {
  return (
    normalizeFleet(trip.buses) ??
    uniformFleet(normalizeBusModel(trip.busModel), trip.busCount ?? 1)
  );
}

/** Id para um ônibus novo: sempre acima de todos os que já existem. */
export function nextBusId(fleet: FleetBus[]): number {
  return fleet.reduce((max, b) => Math.max(max, b.id), 0) + 1;
}

export function fleetCapacity(fleet: FleetBus[]): number {
  return fleet.reduce((sum, b) => sum + BUS_MODELS[b.model].seats, 0);
}

/** Capacidade total da frota da viagem. */
export function tripCapacity(trip: Trip): number {
  return fleetCapacity(tripFleet(trip));
}

/**
 * Monta a planta completa de uma frota. O id de cada poltrona depende só do
 * id do próprio ônibus — nunca da quantidade nem da posição dele na frota.
 * Isso é proposital: adicionar, remover ou trocar o tipo de OUTRO ônibus
 * jamais renumera poltronas que já podem estar vendidas (ver incidente de
 * 24/07/2026 — trocar a quantidade renumerava tudo e "perdia" as vendas já
 * feitas no ônibus 1).
 */
export function generateFleetLayout(fleet: FleetBus[]): BusLayout {
  const mixed = new Set(fleet.map((b) => b.model)).size > 1;
  const decks: BusDeck[] = [];

  fleet.forEach((bus, index) => {
    const def = BUS_MODELS[bus.model];
    const seatId = (n: number) => makeSeatId(bus.id, n);
    for (const deck of def.build(seatId)) {
      const busName = fleet.length > 1 ? `Ônibus ${index + 1}` : "";
      const modelName = mixed ? def.short : "";
      decks.push({
        name: [busName, modelName, deck.name].filter(Boolean).join(" · "),
        rows: deck.rows,
        busId: bus.id,
      });
    }
  });

  return {
    decks,
    totalSeats: fleetCapacity(fleet),
    busIds: fleet.map((b) => b.id),
  };
}

export function busLayoutForTrip(trip: Trip): BusLayout {
  return generateFleetLayout(tripFleet(trip));
}

/** Ids de poltrona que existem numa frota. */
export function fleetValidSeats(fleet: FleetBus[]): Set<string> {
  const set = new Set<string>();
  for (const deck of generateFleetLayout(fleet).decks) {
    for (const r of deck.rows) {
      for (const cell of r) {
        if (cell.type === "seat") set.add(cell.id);
      }
    }
  }
  return set;
}

/**
 * Texto da poltrona para a tela. `busIds` é a frota na ordem (ver
 * BusLayout.busIds): com um ônibus só sai "15"; com mais de um,
 * "Ônibus 2 · polt. 15" — onde 2 é a POSIÇÃO do ônibus, não o id.
 * `null` = frota desconhecida (ex.: viagem apagada): cai no id cru.
 */
export function seatLabel(seat: string, busIds: number[] | null): string {
  const n = seatNumber(seat);
  const busId = seatBusId(seat);
  if (!busIds) return busId === 1 ? n : `Ônibus ${busId} · polt. ${n}`;
  const position = busIds.indexOf(busId) + 1;
  if (!position) return `polt. ${n} (ônibus removido)`;
  return busIds.length > 1 ? `Ônibus ${position} · polt. ${n}` : n;
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
  return fleetValidSeats(tripFleet(trip));
}

/**
 * Poltronas com gente (reserva online ativa ou venda no balcão) — sem contar
 * os bloqueios manuais, que são só uma marcação do admin e podem ser
 * descartados quando a poltrona deixa de existir.
 */
export function soldSeatsForTrip(
  tripId: string,
  reservations: Reservation[],
  manualBookings: ManualBooking[]
): Set<string> {
  const sold = reservationHeldSeats(tripId, reservations);
  for (const s of manualHeldSeats(tripId, manualBookings)) sold.add(s);
  return sold;
}

/**
 * Poltronas vendidas que ficariam sem lugar se a viagem passasse a ter a
 * frota `newFleet`. É a trava única contra "perder" passageiros ao mexer nos
 * ônibus (ver incidente de 24/07/2026): cobre remover um ônibus com gente,
 * trocar para um tipo menor, ou qualquer outra mudança — se devolver algo, o
 * servidor recusa salvar.
 */
export function findOrphanedSoldSeats(
  tripId: string,
  newFleet: FleetBus[],
  reservations: Reservation[],
  manualBookings: ManualBooking[]
): string[] {
  const valid = fleetValidSeats(newFleet);
  return [...soldSeatsForTrip(tripId, reservations, manualBookings)]
    .filter((s) => !valid.has(s))
    .sort(compareSeatIds);
}
