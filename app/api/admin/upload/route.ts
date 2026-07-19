import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import { newId } from "@/lib/utils";
import { UPLOADS_DIR } from "@/lib/uploads";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_SIZE = 15 * 1024 * 1024;
const MAX_WIDTH = 1920;
const WEBP_QUALITY = 82;

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json(
      { error: "Formato inválido. Use JPG, PNG, WebP, GIF ou AVIF." },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Arquivo muito grande (máx. 15 MB)" },
      { status: 400 }
    );
  }

  const uploadDir = UPLOADS_DIR;
  await fs.mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());

  // GIFs animados são mantidos como estão; o restante é otimizado:
  // redimensionado para no máximo 1920px e convertido para WebP.
  if (file.type === "image/gif") {
    const fileName = `${newId()}.gif`;
    await fs.writeFile(path.join(uploadDir, fileName), buffer);
    return NextResponse.json({ url: `/uploads/${fileName}` }, { status: 201 });
  }

  try {
    const fileName = `${newId()}.webp`;
    const optimized = await sharp(buffer)
      .rotate()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
    await fs.writeFile(path.join(uploadDir, fileName), optimized);
    return NextResponse.json(
      {
        url: `/uploads/${fileName}`,
        originalSize: buffer.length,
        optimizedSize: optimized.length,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Não foi possível processar a imagem." },
      { status: 422 }
    );
  }
}
