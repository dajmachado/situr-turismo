"use client";

import { useRouter } from "next/navigation";
import { UserRound } from "lucide-react";
import GoogleLoginButton from "./GoogleLoginButton";

export default function LoginPrompt() {
  const router = useRouter();
  const hasGoogle = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

  return (
    <div className="rounded-3xl bg-white p-10 text-center shadow-soft">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blush text-rose-dark">
        <UserRound size={24} />
      </span>
      {hasGoogle ? (
        <>
          <p className="mt-5 text-sm leading-relaxed text-graphite/65">
            Entre com a sua conta Google para ver suas reservas, acompanhar
            pagamentos e agilizar as próximas compras.
          </p>
          <div className="mt-6 flex justify-center">
            <GoogleLoginButton onLogin={() => router.refresh()} />
          </div>
        </>
      ) : (
        <p className="mt-5 text-sm leading-relaxed text-graphite/65">
          O login está em ativação. Em breve você poderá acompanhar suas
          reservas por aqui — por enquanto, fale com a gente pelo WhatsApp.
        </p>
      )}
    </div>
  );
}
