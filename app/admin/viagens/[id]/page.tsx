import { notFound } from "next/navigation";
import TripForm from "@/components/admin/TripForm";
import { getTrips } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EditTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trip = (await getTrips()).find((t) => t.id === id);
  if (!trip) notFound();

  return (
    <div>
      <h1 className="mb-8 font-[family-name:var(--font-display)] text-3xl font-semibold text-graphite">
        Editar: {trip.title}
      </h1>
      <TripForm trip={trip} />
    </div>
  );
}
