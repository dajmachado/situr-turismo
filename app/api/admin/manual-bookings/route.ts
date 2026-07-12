import { NextResponse } from "next/server";
import { getTrips, getReservations, getManualBookings, saveManualBookings } from "@/lib/db";
import { occupiedSeatsForTrip, validSeatNumbers } from "@/lib/bus";
import { summarizeInstallments } from "@/lib/installments";
import { newId } from "@/lib/utils";
import { sendReservationConfirmation } from "@/lib/notifications";
import { withFileLock } from "@/lib/mutex";
import type { ManualBooking, PassengerDetail, PaymentMethod, Installment } from "@/lib/types";

const METHODS: PaymentMethod[] = [
  "dinheiro",
  "pix",
  "cartao",
  "transferencia",
  "cortesia",
  "parcelado",
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tripId = searchParams.get("tripId");
  const all = await getManualBookings();
  return NextResponse.json(tripId ? all.filter((b) => b.tripId === tripId) : all);
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<ManualBooking>;
  const buyerName = body.buyerName?.trim();
  const tripId = body.tripId;
  const seats = (body.seats ?? []).map(String);

  if (!tripId || !buyerName || seats.length === 0) {
    return NextResponse.json(
      { error: "Informe o nome, a viagem e ao menos uma poltrona." },
      { status: 400 }
    );
  }

  const trip = (await getTrips()).find((t) => t.id === tripId);
  if (!trip) {
    return NextResponse.json({ error: "Viagem não encontrada" }, { status: 404 });
  }

  const valid = validSeatNumbers(trip);
  if (seats.some((s) => !valid.has(s)) || new Set(seats).size !== seats.length) {
    return NextResponse.json({ error: "Poltronas inválidas." }, { status: 400 });
  }

  const passengerDetails: PassengerDetail[] = seats.map((seat, i) => {
    const provided = body.passengerDetails?.find((p) => p.seat === seat);
    return {
      seat,
      name: provided?.name?.trim() || (i === 0 ? buyerName : ""),
      document: provided?.document?.trim() || undefined,
    };
  });

  const method: PaymentMethod = METHODS.includes(body.paymentMethod as PaymentMethod)
    ? (body.paymentMethod as PaymentMethod)
    : "dinheiro";

  const installments: Installment[] | undefined =
    method === "parcelado" && body.installments?.length
      ? body.installments.map((inst, i) => ({
          id: inst.id || newId(),
          number: inst.number || i + 1,
          dueDate: inst.dueDate,
          amount: Number(inst.amount) || 0,
          status: inst.status === "pago" ? "pago" : "pendente",
          paidAt: inst.paidAt,
          paidAmount: inst.paidAmount,
          notes: inst.notes,
        }))
      : undefined;

  // Num carnê, o status geral é derivado das parcelas — nunca confiamos no
  // que o cliente manda para esse campo quando o método é "parcelado".
  const status =
    method === "parcelado"
      ? summarizeInstallments(installments ?? []).fullyPaid
        ? "pago"
        : "reservado"
      : body.status === "reservado"
        ? "reservado"
        : "pago";

  const now = new Date().toISOString();
  const booking: ManualBooking = {
    id: newId(),
    tripId,
    buyerName,
    phone: body.phone?.trim() || undefined,
    seats,
    passengerDetails,
    amount: Number(body.amount) || 0,
    paymentMethod: method,
    boardingPoint: body.boardingPoint?.trim() || undefined,
    notes: body.notes?.trim() || undefined,
    status,
    createdAt: now,
    updatedAt: now,
    buyerDocument: body.buyerDocument?.trim() || undefined,
    buyerBirthDate: body.buyerBirthDate?.trim() || undefined,
    buyerAddress: body.buyerAddress?.trim() || undefined,
    buyerCep: body.buyerCep?.trim() || undefined,
    installments,
  };

  // Trava a escrita do arquivo para não perder alterações concorrentes
  // (ex.: outra venda sendo registrada/editada ao mesmo tempo).
  const conflict = await withFileLock("manual-bookings", async () => {
    const [reservations, manual] = await Promise.all([
      getReservations(),
      getManualBookings(),
    ]);
    const occupied = occupiedSeatsForTrip(trip, reservations, manual);
    const taken = seats.filter((s) => occupied.has(s));
    if (taken.length) return taken;

    manual.push(booking);
    await saveManualBookings(manual);
    return null;
  });

  if (conflict) {
    return NextResponse.json(
      { error: `As poltronas ${conflict.join(", ")} já estão ocupadas.` },
      { status: 409 }
    );
  }

  if (booking.status === "pago") {
    sendReservationConfirmation({
      name: booking.buyerName,
      phone: booking.phone,
      tripTitle: trip.title,
      tripDate: trip.date,
      seats: booking.seats,
      passengers: booking.seats.length,
      amount: booking.amount,
      reference: booking.id,
    }).catch(() => {});
  }

  return NextResponse.json(booking, { status: 201 });
}
