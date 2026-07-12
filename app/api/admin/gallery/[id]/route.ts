import { NextResponse } from "next/server";
import { getGallery, saveGallery } from "@/lib/db";
import type { GalleryItem } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Ctx) {
  const { id } = await params;
  const body = (await request.json()) as Partial<GalleryItem>;
  const items = await getGallery();
  const index = items.findIndex((g) => g.id === id);
  if (index === -1) {
    return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
  }
  items[index] = { ...items[index], ...body, id };

  // Só pode haver uma capa por álbum (viagem): limpa as demais.
  if (body.cover === true) {
    const slug = items[index].tripSlug;
    items.forEach((it, i) => {
      if (i !== index && it.tripSlug === slug) it.cover = false;
    });
  }

  await saveGallery(items);
  return NextResponse.json(items[index]);
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const items = await getGallery();
  const filtered = items.filter((g) => g.id !== id);
  if (filtered.length === items.length) {
    return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
  }
  await saveGallery(filtered);
  return NextResponse.json({ ok: true });
}
