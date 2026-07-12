import { notFound } from "next/navigation";
import { getTrips } from "@/lib/db";
import FinanceClient from "@/components/admin/FinanceClient";

export const dynamic = "force-dynamic";

export default async function FinancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trip = (await getTrips()).find((t) => t.id === id);
  if (!trip) notFound();
  return <FinanceClient tripId={id} />;
}
