import { NextResponse, type NextRequest } from "next/server";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { UPLOADS_DIR } from "@/lib/uploads";

// O Next.js (next start) não passa a servir arquivos adicionados a public/
// depois que o processo iniciou — quebra uploads feitos pelo admin em
// produção (o container só "enxerga" o arquivo novo após reiniciar). Esta
// rota lê do disco a cada requisição, sem esse cache.
export const dynamic = "force-dynamic";

const MIME: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

async function resolveFile(params: Promise<{ path: string[] }>) {
  const { path: segments } = await params;
  if (segments.some((s) => s.includes(".."))) return null;
  const filePath = path.join(UPLOADS_DIR, ...segments);
  if (!filePath.startsWith(UPLOADS_DIR)) return null;
  try {
    const info = await stat(filePath);
    if (!info.isFile()) return null;
    return { filePath, size: info.size };
  } catch {
    return null;
  }
}

/** "bytes=100-199" / "bytes=100-" / "bytes=-500" → intervalo; null = inválido. */
function parseRange(header: string, size: number): { start: number; end: number } | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || (match[1] === "" && match[2] === "")) return null;
  let start: number;
  let end: number;
  if (match[1] === "") {
    // sufixo: os últimos N bytes
    start = Math.max(0, size - Number(match[2]));
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] === "" ? size - 1 : Math.min(Number(match[2]), size - 1);
  }
  if (start > end || start >= size) return null;
  return { start, end };
}

function baseHeaders(filePath: string): Record<string, string> {
  return {
    "Content-Type": MIME[path.extname(filePath).toLowerCase()] ?? "application/octet-stream",
    "Cache-Control": "public, max-age=31536000, immutable",
    // Vídeo no Safari/iPhone só toca se o servidor atender pedidos por pedaço
    "Accept-Ranges": "bytes",
  };
}

function streamFile(filePath: string, start: number, end: number) {
  return Readable.toWeb(createReadStream(filePath, { start, end })) as ReadableStream;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const file = await resolveFile(params);
  if (!file) return new NextResponse(null, { status: 404 });
  const { filePath, size } = file;
  const headers = baseHeaders(filePath);

  const rangeHeader = request.headers.get("range");
  if (rangeHeader && size > 0) {
    const range = parseRange(rangeHeader, size);
    if (!range) {
      return new NextResponse(null, {
        status: 416,
        headers: { ...headers, "Content-Range": `bytes */${size}` },
      });
    }
    return new NextResponse(streamFile(filePath, range.start, range.end), {
      status: 206,
      headers: {
        ...headers,
        "Content-Range": `bytes ${range.start}-${range.end}/${size}`,
        "Content-Length": String(range.end - range.start + 1),
      },
    });
  }

  if (size === 0) {
    return new NextResponse(null, { headers: { ...headers, "Content-Length": "0" } });
  }
  return new NextResponse(streamFile(filePath, 0, size - 1), {
    headers: { ...headers, "Content-Length": String(size) },
  });
}

export async function HEAD(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const file = await resolveFile(params);
  if (!file) return new NextResponse(null, { status: 404 });
  return new NextResponse(null, {
    headers: { ...baseHeaders(file.filePath), "Content-Length": String(file.size) },
  });
}
