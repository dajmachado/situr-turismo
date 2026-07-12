import { NextResponse } from "next/server";
import { getReservations } from "@/lib/db";
import {
  checkPayment,
  isPaymentConfigured,
  applyPaymentToReservation,
} from "@/lib/checkout";

// Chamado pela página de confirmação com os parâmetros que a InfinitePay
// devolve no redirect (order_nsu, transaction_nsu, slug).
export async function GET(request: Request) {
  if (!isPaymentConfigured()) {
    return NextResponse.json({ error: "Pagamento não configurado" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const orderNsu = searchParams.get("order_nsu");
  const transactionNsu = searchParams.get("transaction_nsu");
  let slug = searchParams.get("slug");

  if (!orderNsu || !transactionNsu) {
    return NextResponse.json(
      { error: "order_nsu e transaction_nsu são obrigatórios" },
      { status: 400 }
    );
  }

  // O slug da fatura fica salvo na reserva caso não venha no redirect
  if (!slug) {
    const reservation = (await getReservations()).find((r) => r.id === orderNsu);
    slug = reservation?.checkoutSlug ?? "";
  }

  try {
    const result = await checkPayment({
      orderNsu,
      transactionNsu,
      slug: slug ?? "",
    });

    const reservation = await applyPaymentToReservation({
      reservationId: orderNsu,
      paid: result.paid,
      transactionNsu,
      captureMethod: result.captureMethod,
    });

    return NextResponse.json({
      paid: result.paid,
      captureMethod: result.captureMethod,
      installments: result.installments,
      reservation: reservation
        ? {
            id: reservation.id,
            tripTitle: reservation.tripTitle,
            tripDate: reservation.tripDate,
            passengers: reservation.passengers,
            amount: reservation.amount,
            email: reservation.email,
            status: reservation.status,
          }
        : null,
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível confirmar o pagamento" },
      { status: 502 }
    );
  }
}
