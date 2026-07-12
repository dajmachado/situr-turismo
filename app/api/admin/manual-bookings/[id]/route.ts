import { NextResponse } from "next/server";
import { getTrips, getReservations, getManualBookings, saveManualBookings } from "@/lib/db";
import { occupiedSeatsForTrip, validSeatNumbers } from "@/lib/bus";
import { summarizeInstallments } from "@/lib/installments";
import { sendReservationConfirmation } from "@/lib/notifications";
import { withFileLock } from "@/lib/mutex";
import { newId } from "@/lib/utils";
import type { ManualBooking, PassengerDetail, PaymentMethod, Installment } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

const METHODS: PaymentMethod[] = [
  "dinheiro",
  "pix",
  "cartao",
  "transferencia",
  "cortesia",
  "parcelado",
];

export async function PUT(request: Request, { params }: Ctx) {
  const { id } = await params;
  const body = (await request.json()) as Partial<ManualBooking>;

  const result = await withFileLock("manual-bookings", async () => {
    const manual = await getManualBookings();
    const index = manual.findIndex((b) => b.id === id);
    if (index === -1) {
      return { error: "Venda não encontrada", status: 404 as const };
    }

    const current = manual[index];
    const trip = (await getTrips()).find((t) => t.id === current.tripId);
    if (!trip) {
      return { error: "Viagem não encontrada", status: 404 as const };
    }

    const seats = (body.seats ?? current.seats).map(String);
    const valid = validSeatNumbers(trip);
    if (seats.some((s) => !valid.has(s)) || new Set(seats).size !== seats.length) {
      return { error: "Poltronas inválidas.", status: 400 as const };
    }

    const reservations = await getReservations();
    // Ocupação de todos, menos esta própria venda (que está sendo editada)
    const others = manual.filter((b) => b.id !== id);
    const occupied = occupiedSeatsForTrip(trip, reservations, others);
    const taken = seats.filter((s) => occupied.has(s));
    if (taken.length) {
      return {
        error: `As poltronas ${taken.join(", ")} já estão ocupadas.`,
        status: 409 as const,
      };
    }

    const buyerName = body.buyerName?.trim() || current.buyerName;
    const passengerDetails: PassengerDetail[] = seats.map((seat, i) => {
      const provided = body.passengerDetails?.find((p) => p.seat === seat);
      const existing = current.passengerDetails.find((p) => p.seat === seat);
      return {
        seat,
        name:
          provided?.name?.trim() ||
          existing?.name ||
          (i === 0 ? buyerName : ""),
        document: provided?.document?.trim() || existing?.document || undefined,
      };
    });

    const method = METHODS.includes(body.paymentMethod as PaymentMethod)
      ? (body.paymentMethod as PaymentMethod)
      : current.paymentMethod;

    const installments: Installment[] | undefined =
      method === "parcelado"
        ? (body.installments ?? current.installments ?? []).map((inst, i) => ({
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

    // Num carnê, o status geral é sempre derivado das parcelas.
    const newStatus =
      method === "parcelado"
        ? summarizeInstallments(installments ?? []).fullyPaid
          ? "pago"
          : "reservado"
        : body.status === "reservado"
          ? "reservado"
          : body.status === "pago"
            ? "pago"
            : current.status;

    manual[index] = {
      ...current,
      buyerName,
      phone: body.phone?.trim() ?? current.phone,
      seats,
      passengerDetails,
      amount: body.amount !== undefined ? Number(body.amount) || 0 : current.amount,
      paymentMethod: method,
      boardingPoint: body.boardingPoint?.trim() ?? current.boardingPoint,
      notes: body.notes?.trim() ?? current.notes,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      buyerDocument: body.buyerDocument?.trim() ?? current.buyerDocument,
      buyerBirthDate: body.buyerBirthDate?.trim() ?? current.buyerBirthDate,
      buyerAddress: body.buyerAddress?.trim() ?? current.buyerAddress,
      buyerCep: body.buyerCep?.trim() ?? current.buyerCep,
      installments: method === "parcelado" ? installments : current.installments,
    };
    await saveManualBookings(manual);

    return {
      booking: manual[index],
      trip,
      wasPago: current.status === "pago",
    };
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  // Confirmação disparada só na transição para "pago" (não a cada edição)
  if (!result.wasPago && result.booking.status === "pago") {
    sendReservationConfirmation({
      name: result.booking.buyerName,
      phone: result.booking.phone,
      tripTitle: result.trip.title,
      tripDate: result.trip.date,
      seats: result.booking.seats,
      passengers: result.booking.seats.length,
      amount: result.booking.amount,
      reference: result.booking.id,
    }).catch(() => {});
  }

  return NextResponse.json(result.booking);
}

/**
 * Dá baixa (ou desfaz a baixa) em UMA parcela do carnê, sem precisar
 * reenviar a venda inteira — usado pela tela de Parcelamentos.
 */
export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  const body = (await request.json()) as {
    installmentId?: string;
    status?: "pago" | "pendente";
    paidAt?: string;
    paidAmount?: number;
    dueDate?: string;
    amount?: number;
    notes?: string;
  };

  if (!body.installmentId) {
    return NextResponse.json({ error: "installmentId é obrigatório" }, { status: 400 });
  }

  const result = await withFileLock("manual-bookings", async () => {
    const manual = await getManualBookings();
    const index = manual.findIndex((b) => b.id === id);
    if (index === -1) {
      return { error: "Venda não encontrada", status: 404 as const };
    }

    const current = manual[index];
    const installments = current.installments ?? [];
    const instIndex = installments.findIndex((i) => i.id === body.installmentId);
    if (instIndex === -1) {
      return { error: "Parcela não encontrada", status: 404 as const };
    }

    const wasFullyPaid = summarizeInstallments(installments).fullyPaid;

    const updated: Installment = { ...installments[instIndex] };
    if (body.status === "pago") {
      updated.status = "pago";
      updated.paidAt = body.paidAt || new Date().toLocaleDateString("pt-BR");
      updated.paidAmount = body.paidAmount ?? updated.amount;
    } else if (body.status === "pendente") {
      updated.status = "pendente";
      updated.paidAt = undefined;
      updated.paidAmount = undefined;
    }
    if (body.dueDate) updated.dueDate = body.dueDate;
    if (body.amount !== undefined) updated.amount = Number(body.amount) || 0;
    if (body.notes !== undefined) updated.notes = body.notes;

    const newInstallments = [...installments];
    newInstallments[instIndex] = updated;
    const summary = summarizeInstallments(newInstallments);

    manual[index] = {
      ...current,
      installments: newInstallments,
      status: summary.fullyPaid ? "pago" : "reservado",
      updatedAt: new Date().toISOString(),
    };
    await saveManualBookings(manual);

    return {
      booking: manual[index],
      justCompleted: !wasFullyPaid && summary.fullyPaid,
    };
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  // Confirmação disparada só quando o carnê é quitado agora (não antes)
  if (result.justCompleted) {
    const trip = (await getTrips()).find((t) => t.id === result.booking.tripId);
    if (trip) {
      sendReservationConfirmation({
        name: result.booking.buyerName,
        phone: result.booking.phone,
        tripTitle: trip.title,
        tripDate: trip.date,
        seats: result.booking.seats,
        passengers: result.booking.seats.length,
        amount: result.booking.amount,
        reference: result.booking.id,
      }).catch(() => {});
    }
  }

  return NextResponse.json(result.booking);
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const result = await withFileLock("manual-bookings", async () => {
    const manual = await getManualBookings();
    const filtered = manual.filter((b) => b.id !== id);
    if (filtered.length === manual.length) return false;
    await saveManualBookings(filtered);
    return true;
  });

  if (!result) {
    return NextResponse.json({ error: "Venda não encontrada" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
