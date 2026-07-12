import { NextResponse } from "next/server";
import { getBanners, saveBanners } from "@/lib/db";
import { newId } from "@/lib/utils";
import type { Banner } from "@/lib/types";

export async function GET() {
  return NextResponse.json(await getBanners());
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<Banner>;
  if (!body.title || !body.image) {
    return NextResponse.json(
      { error: "Título e imagem são obrigatórios" },
      { status: 400 }
    );
  }

  const banners = await getBanners();
  const banner: Banner = {
    id: newId(),
    title: body.title,
    subtitle: body.subtitle ?? "",
    price: body.price ?? "",
    image: body.image,
    tripSlug: body.tripSlug ?? "",
    order: Number(body.order) || banners.length + 1,
  };
  banners.push(banner);
  await saveBanners(banners);
  return NextResponse.json(banner, { status: 201 });
}
