import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL!,
    // Tempo de espera antes de lançar SQLITE_BUSY numa escrita concorrente
    // (complementa, não substitui, lib/mutex.ts — que serializa a lógica de
    // negócio de leitura-checagem-escrita, não só o acesso ao arquivo).
    timeout: 5000,
  });
  const client = new PrismaClient({ adapter });
  client.$executeRawUnsafe("PRAGMA journal_mode = WAL;").catch(() => {});
  return client;
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
