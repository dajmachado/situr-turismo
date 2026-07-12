import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getTrips } from "@/lib/db";
import ManifestClient from "@/components/admin/ManifestClient";

export const dynamic = "force-dynamic";

export default async function PassengersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trip = (await getTrips()).find((t) => t.id === id);
  if (!trip) notFound();
  return (
    <Suspense
      fallback={
        <p className="flex items-center gap-2 text-sm text-graphite/55">
          <Loader2 size={16} className="animate-spin" />
          Carregando a lista de embarque...
        </p>
      }
    >
      <ManifestClient tripId={id} />
    </Suspense>
  );
}
