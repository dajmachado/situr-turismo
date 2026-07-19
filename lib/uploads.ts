import path from "node:path";

// Fora de public/ de propósito — o Next.js (next start) não serve arquivos
// adicionados a public/ depois que o processo iniciou (ver app/uploads/
// [...path]/route.ts, que serve essas imagens lendo do disco a cada
// requisição em vez de depender do provedor estático do Next).
export const UPLOADS_DIR = path.join(process.cwd(), "uploads-data");
