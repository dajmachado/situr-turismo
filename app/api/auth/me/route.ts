import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionCustomer, destroySession, SESSION_COOKIE } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const customer = await getSessionCustomer(
    cookieStore.get(SESSION_COOKIE)?.value
  );
  if (!customer) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({
    user: {
      name: customer.name,
      email: customer.email,
      phone: customer.phone ?? "",
      picture: customer.picture ?? "",
    },
  });
}

export async function DELETE() {
  const cookieStore = await cookies();
  await destroySession(cookieStore.get(SESSION_COOKIE)?.value);
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
