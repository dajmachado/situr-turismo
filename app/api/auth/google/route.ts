import { NextResponse } from "next/server";
import {
  verifyGoogleToken,
  upsertCustomer,
  createSession,
  SESSION_COOKIE,
} from "@/lib/auth";

export async function POST(request: Request) {
  const { credential } = (await request.json()) as { credential?: string };
  if (!credential) {
    return NextResponse.json({ error: "Credencial ausente" }, { status: 400 });
  }

  const profile = await verifyGoogleToken(credential);
  if (!profile) {
    return NextResponse.json({ error: "Login inválido" }, { status: 401 });
  }

  const customer = await upsertCustomer(profile);
  const session = await createSession(customer.id);
  if (!session) {
    return NextResponse.json({ error: "Erro ao criar sessão" }, { status: 500 });
  }

  const response = NextResponse.json({
    name: customer.name,
    email: customer.email,
    phone: customer.phone ?? "",
    picture: customer.picture ?? "",
  });
  response.cookies.set(SESSION_COOKIE, session, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
