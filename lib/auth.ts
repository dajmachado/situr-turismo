import { randomBytes } from "crypto";
import { getCustomers, saveCustomers } from "./db";
import { newId } from "./utils";
import type { Customer } from "./types";

export const SESSION_COOKIE = "situr_session";

type GoogleTokenInfo = {
  aud?: string;
  sub?: string;
  email?: string;
  email_verified?: string;
  name?: string;
  picture?: string;
};

/**
 * Valida o ID token do Google (botão "Entrar com Google") junto ao
 * endpoint oficial de tokeninfo e confere se pertence ao nosso client id.
 */
export async function verifyGoogleToken(credential: string): Promise<{
  googleId: string;
  email: string;
  name: string;
  picture?: string;
} | null> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId || !credential) return null;

  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
  );
  if (!res.ok) return null;

  const info = (await res.json()) as GoogleTokenInfo;
  if (
    info.aud !== clientId ||
    !info.sub ||
    !info.email ||
    info.email_verified !== "true"
  ) {
    return null;
  }

  return {
    googleId: info.sub,
    email: info.email.toLowerCase(),
    name: info.name ?? info.email.split("@")[0],
    picture: info.picture,
  };
}

/**
 * Cria/atualiza o cliente na base. Usado tanto no login com Google
 * quanto a cada compra (guest checkout também vira cliente).
 */
export async function upsertCustomer(data: {
  name: string;
  email: string;
  phone?: string;
  googleId?: string;
  picture?: string;
}): Promise<Customer> {
  const customers = await getCustomers();
  const email = data.email.trim().toLowerCase();
  const now = new Date().toISOString();

  let customer = customers.find(
    (c) =>
      (data.googleId && c.googleId === data.googleId) || c.email === email
  );

  if (customer) {
    customer.name = data.name || customer.name;
    customer.email = email;
    if (data.phone) customer.phone = data.phone;
    if (data.googleId) customer.googleId = data.googleId;
    if (data.picture) customer.picture = data.picture;
    customer.updatedAt = now;
  } else {
    customer = {
      id: newId(),
      name: data.name,
      email,
      phone: data.phone,
      googleId: data.googleId,
      picture: data.picture,
      createdAt: now,
      updatedAt: now,
    };
    customers.push(customer);
  }

  await saveCustomers(customers);
  return customer;
}

/** Gera um token de sessão e grava no cliente. Cookie: "<id>.<token>" */
export async function createSession(customerId: string): Promise<string | null> {
  const customers = await getCustomers();
  const customer = customers.find((c) => c.id === customerId);
  if (!customer) return null;
  const token = randomBytes(24).toString("hex");
  customer.sessionToken = token;
  customer.updatedAt = new Date().toISOString();
  await saveCustomers(customers);
  return `${customer.id}.${token}`;
}

export async function getSessionCustomer(
  cookieValue: string | undefined
): Promise<Customer | null> {
  if (!cookieValue) return null;
  const dot = cookieValue.indexOf(".");
  if (dot === -1) return null;
  const id = cookieValue.slice(0, dot);
  const token = cookieValue.slice(dot + 1);
  if (!id || !token) return null;
  const customers = await getCustomers();
  const customer = customers.find((c) => c.id === id);
  if (!customer || !customer.sessionToken || customer.sessionToken !== token) {
    return null;
  }
  return customer;
}

export async function destroySession(
  cookieValue: string | undefined
): Promise<void> {
  const customer = await getSessionCustomer(cookieValue);
  if (!customer) return;
  const customers = await getCustomers();
  const found = customers.find((c) => c.id === customer.id);
  if (found) {
    delete found.sessionToken;
    await saveCustomers(customers);
  }
}
