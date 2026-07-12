import type { Trip, Reservation, ManualBooking } from "./types";
import { compareSeatIds, tripCapacity } from "./bus";

export type ManifestRow = {
  seat: string;
  passengerName: string;
  document?: string;
  buyerName: string;
  phone?: string;
  origin: "online" | "balcao";
  status: "confirmado" | "pendente" | "reservado";
  paymentMethod?: string;
  boardingPoint?: string;
  amountPerSeat: number;
  bookingId: string;
  isManual: boolean;
};

export type ManifestSummary = {
  capacity: number;
  confirmed: number;
  pending: number;
  blocked: number;
  free: number;
  receivedOnline: number;
  receivedManual: number;
  toReceive: number;
  total: number;
};

export type Manifest = { rows: ManifestRow[]; summary: ManifestSummary };

export function buildManifest(
  trip: Trip,
  reservations: Reservation[],
  manual: ManualBooking[]
): Manifest {
  const rows: ManifestRow[] = [];

  // Reservas online (apenas as que seguram vaga: aprovadas e pendentes)
  for (const r of reservations) {
    if (r.tripId !== trip.id) continue;
    if (r.status !== "approved" && r.status !== "pending") continue;
    if (!r.seats?.length) continue;
    const perSeat = r.passengers ? r.amount / r.passengers : r.amount;
    for (const seat of r.seats) {
      const pd = r.passengerDetails?.find((p) => p.seat === seat);
      rows.push({
        seat,
        passengerName: pd?.name || r.name,
        document: pd?.document,
        buyerName: r.name,
        phone: r.phone,
        origin: "online",
        status: r.status === "approved" ? "confirmado" : "pendente",
        paymentMethod: r.paymentMethod,
        amountPerSeat: perSeat,
        bookingId: r.id,
        isManual: false,
      });
    }
  }

  // Vendas no balcão
  for (const b of manual) {
    if (b.tripId !== trip.id) continue;
    const perSeat = b.seats.length ? b.amount / b.seats.length : b.amount;
    for (const seat of b.seats) {
      const pd = b.passengerDetails.find((p) => p.seat === seat);
      rows.push({
        seat,
        passengerName: pd?.name || b.buyerName,
        document: pd?.document,
        buyerName: b.buyerName,
        phone: b.phone,
        origin: "balcao",
        status: b.status === "pago" ? "confirmado" : "reservado",
        paymentMethod: b.paymentMethod,
        boardingPoint: b.boardingPoint,
        amountPerSeat: perSeat,
        bookingId: b.id,
        isManual: true,
      });
    }
  }

  rows.sort((a, b) => compareSeatIds(a.seat, b.seat));

  const capacity = tripCapacity(trip);
  const confirmed = rows.filter((r) => r.status === "confirmado").length;
  const pending = rows.filter((r) => r.status === "pendente").length;
  const reserved = rows.filter((r) => r.status === "reservado").length;
  const blocked = (trip.blockedSeats ?? []).length;

  const receivedOnline = reservations
    .filter((r) => r.tripId === trip.id && r.status === "approved")
    .reduce((s, r) => s + r.amount, 0);
  const receivedManual = manual
    .filter((b) => b.tripId === trip.id && b.status === "pago")
    .reduce((s, b) => s + b.amount, 0);
  const toReceive = manual
    .filter((b) => b.tripId === trip.id && b.status === "reservado")
    .reduce((s, b) => s + b.amount, 0);

  return {
    rows,
    summary: {
      capacity,
      confirmed,
      pending,
      blocked,
      free: Math.max(0, capacity - confirmed - pending - reserved - blocked),
      receivedOnline,
      receivedManual,
      toReceive,
      total: receivedOnline + receivedManual,
    },
  };
}
