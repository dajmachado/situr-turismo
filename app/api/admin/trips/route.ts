import { NextResponse } from "next/server";
import { getTrips, getTripsWithLiveSpots, saveTrips } from "@/lib/db";
import { newId, slugify } from "@/lib/utils";
import type { Trip } from "@/lib/types";

export async function GET() {
  return NextResponse.json(await getTripsWithLiveSpots());
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<Trip>;
  if (!body.title) {
    return NextResponse.json({ error: "Título é obrigatório" }, { status: 400 });
  }

  const trips = await getTrips();
  const trip: Trip = {
    id: newId(),
    slug: body.slug?.trim() || slugify(body.title),
    title: body.title,
    destination: body.destination ?? "",
    date: body.date ?? "",
    duration: body.duration ?? "",
    price: Number(body.price) || 0,
    installments: body.installments ?? "",
    spotsTotal: Number(body.spotsTotal) || 0,
    spotsLeft: Number(body.spotsLeft) || 0,
    shortDescription: body.shortDescription ?? "",
    description: body.description ?? "",
    coverImage: body.coverImage ?? "",
    gallery: body.gallery ?? [],
    hotel: body.hotel,
    included: body.included ?? [],
    notIncluded: body.notIncluded ?? [],
    mapEmbedUrl: body.mapEmbedUrl,
    itinerary: body.itinerary ?? [],
    faq: body.faq ?? [],
    featured: body.featured ?? true,
    busModel: body.busModel === "dd43" ? "dd43" : "exec46",
    busCount: Math.min(6, Math.max(1, Number(body.busCount) || 1)),
    blockedSeats: body.blockedSeats ?? [],
  };

  if (trips.some((t) => t.slug === trip.slug)) {
    trip.slug = `${trip.slug}-${trip.id.slice(-4)}`;
  }

  trips.push(trip);
  await saveTrips(trips);
  return NextResponse.json(trip, { status: 201 });
}
