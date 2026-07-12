import { NextResponse } from "next/server";
import { getGallery, saveGallery } from "@/lib/db";
import { newId } from "@/lib/utils";
import type { GalleryItem } from "@/lib/types";

export async function GET() {
  return NextResponse.json(await getGallery());
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<GalleryItem>;
  if (!body.image) {
    return NextResponse.json({ error: "Imagem é obrigatória" }, { status: 400 });
  }
  if (!body.tripSlug) {
    return NextResponse.json(
      { error: "Selecione a viagem desta foto" },
      { status: 400 }
    );
  }
  const items = await getGallery();
  const item: GalleryItem = {
    id: newId(),
    image: body.image,
    caption: body.caption ?? "",
    tripSlug: body.tripSlug,
  };
  items.push(item);
  await saveGallery(items);
  return NextResponse.json(item, { status: 201 });
}
