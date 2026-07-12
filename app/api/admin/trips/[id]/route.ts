import { NextResponse } from "next/server";
import { getTrips, saveTrips } from "@/lib/db";
import type { Trip } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const trip = (await getTrips()).find((t) => t.id === id);
  if (!trip) {
    return NextResponse.json({ error: "Viagem não encontrada" }, { status: 404 });
  }
  return NextResponse.json(trip);
}

export async function PUT(request: Request, { params }: Ctx) {
  const { id } = await params;
  const body = (await request.json()) as Partial<Trip>;
  const trips = await getTrips();
  const index = trips.findIndex((t) => t.id === id);
  if (index === -1) {
    return NextResponse.json({ error: "Viagem não encontrada" }, { status: 404 });
  }

  trips[index] = {
    ...trips[index],
    ...body,
    id,
    price: Number(body.price ?? trips[index].price) || 0,
    spotsTotal: Number(body.spotsTotal ?? trips[index].spotsTotal) || 0,
    spotsLeft: Number(body.spotsLeft ?? trips[index].spotsLeft) || 0,
  };
  await saveTrips(trips);
  return NextResponse.json(trips[index]);
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const trips = await getTrips();
  const filtered = trips.filter((t) => t.id !== id);
  if (filtered.length === trips.length) {
    return NextResponse.json({ error: "Viagem não encontrada" }, { status: 404 });
  }
  await saveTrips(filtered);
  return NextResponse.json({ ok: true });
}
