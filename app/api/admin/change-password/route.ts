import { NextResponse } from "next/server";
import { verifyAdminPassword, setAdminPassword } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const { currentPassword, newPassword } = await request.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Preencha a senha atual e a nova senha." },
      { status: 400 }
    );
  }
  if (String(newPassword).length < 6) {
    return NextResponse.json(
      { error: "A nova senha precisa ter pelo menos 6 caracteres." },
      { status: 400 }
    );
  }
  if (!(await verifyAdminPassword(currentPassword))) {
    return NextResponse.json({ error: "Senha atual incorreta." }, { status: 401 });
  }

  await setAdminPassword(newPassword);
  return NextResponse.json({ ok: true });
}
