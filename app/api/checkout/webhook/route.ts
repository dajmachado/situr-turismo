import { NextResponse } from "next/server";
import {
  checkPayment,
  isPaymentConfigured,
  applyPaymentToReservation,
} from "@/lib/checkout";

// Webhook da InfinitePay — enviado quando um pagamento é aprovado.
// Configure INFINITEPAY_WEBHOOK_URL apontando para
// https://<seu-dominio>/api/checkout/webhook
export async function POST(request: Request) {
  if (!isPaymentConfigured()) {
    return NextResponse.json({ ok: true });
  }

  try {
    const body = (await request.json()) as {
      invoice_slug?: string;
      transaction_nsu?: string;
      order_nsu?: string;
      capture_method?: string;
    };

    if (body.order_nsu && body.transaction_nsu) {
      // Nunca confiamos só no corpo do webhook: reconfirmamos na API.
      const result = await checkPayment({
        orderNsu: body.order_nsu,
        transactionNsu: body.transaction_nsu,
        slug: body.invoice_slug ?? "",
      });

      await applyPaymentToReservation({
        reservationId: body.order_nsu,
        paid: result.paid,
        transactionNsu: body.transaction_nsu,
        checkoutSlug: body.invoice_slug,
        captureMethod: result.captureMethod ?? body.capture_method,
      });
    }
  } catch {
    // Respondemos 200 mesmo assim; a confirmação também acontece
    // pela página de retorno (payment_check).
  }

  return NextResponse.json({ ok: true });
}
