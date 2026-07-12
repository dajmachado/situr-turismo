import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import ConfirmationClient from "@/components/checkout/ConfirmationClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Confirmação da reserva",
  robots: { index: false, follow: false },
};

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <section className="container-site flex min-h-[50vh] items-center justify-center py-20">
          <p className="flex items-center gap-2 text-sm text-graphite/55">
            <Loader2 size={16} className="animate-spin" />
            Confirmando seu pagamento...
          </p>
        </section>
      }
    >
      <ConfirmationClient />
    </Suspense>
  );
}
