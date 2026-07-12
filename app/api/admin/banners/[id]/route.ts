import { NextResponse } from "next/server";
import { getBanners, saveBanners } from "@/lib/db";
import type { Banner } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Ctx) {
  const { id } = await params;
  const body = (await request.json()) as Partial<Banner>;
  const banners = await getBanners();
  const index = banners.findIndex((b) => b.id === id);
  if (index === -1) {
    return NextResponse.json({ error: "Banner não encontrado" }, { status: 404 });
  }
  banners[index] = {
    ...banners[index],
    ...body,
    id,
    order: Number(body.order ?? banners[index].order) || 1,
  };
  await saveBanners(banners);
  return NextResponse.json(banners[index]);
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const banners = await getBanners();
  const filtered = banners.filter((b) => b.id !== id);
  if (filtered.length === banners.length) {
    return NextResponse.json({ error: "Banner não encontrado" }, { status: 404 });
  }
  await saveBanners(filtered);
  return NextResponse.json({ ok: true });
}
