import { NextResponse } from "next/server";
import { verifyAdminPassword } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const { password } = await request.json();

  if (!(await verifyAdminPassword(password))) {
    return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("situr_admin", "authenticated", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    // 90 dias — a equipe do balcão costuma deixar o navegador aberto por
    // dias/semanas seguidas sem relogar; 7 dias era curto demais e causava
    // "Não autorizado" no meio de uma venda sem aviso claro (ver Sandra,
    // 11/08/2026: sessão expirou com o modal de venda já preenchido).
    maxAge: 60 * 60 * 24 * 90,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("situr_admin");
  return response;
}
