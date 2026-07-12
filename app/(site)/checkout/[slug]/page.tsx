import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTripBySlug, getTripBySlugWithLiveSpots } from "@/lib/db";
import { isPaymentConfigured } from "@/lib/checkout";
import CheckoutClient from "@/components/checkout/CheckoutClient";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const trip = await getTripBySlug(slug);
  return {
    title: trip ? `Reservar — ${trip.title}` : "Reserva",
    robots: { index: false, follow: false },
  };
}

export default async function CheckoutPage({ params }: Props) {
  const { slug } = await params;
  const trip = await getTripBySlugWithLiveSpots(slug);
  if (!trip) notFound();

  return <CheckoutClient trip={trip} paymentEnabled={isPaymentConfigured()} />;
}
