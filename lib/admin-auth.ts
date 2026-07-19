import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { prisma } from "./prisma";

// Linha única de configurações do admin (id fixo). Enquanto o admin nunca
// trocou a senha pelo painel, não existe linha na tabela e o login usa o
// fallback de ADMIN_PASSWORD (env) — assim que a senha é trocada uma vez,
// o hash no banco passa a ser a fonte de verdade.
const SETTINGS_ID = "admin";
const FALLBACK_PASSWORD = process.env.ADMIN_PASSWORD ?? "situr2026";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyHash(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuffer = Buffer.from(hash, "hex");
  const candidate = scryptSync(password, salt, 64);
  if (candidate.length !== hashBuffer.length) return false;
  return timingSafeEqual(candidate, hashBuffer);
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const settings = await prisma.adminSettings.findUnique({
    where: { id: SETTINGS_ID },
  });
  if (settings) return verifyHash(password, settings.passwordHash);
  return password === FALLBACK_PASSWORD;
}

export async function setAdminPassword(newPassword: string): Promise<void> {
  const passwordHash = hashPassword(newPassword);
  const updatedAt = new Date().toISOString();
  await prisma.adminSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, passwordHash, updatedAt },
    update: { passwordHash, updatedAt },
  });
}
