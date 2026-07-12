"use client";

import { useEffect, useRef, useState } from "react";

type GoogleUser = {
  name: string;
  email: string;
  phone: string;
  picture: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: Record<string, unknown>
          ) => void;
        };
      };
    };
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function GoogleLoginButton({
  onLogin,
}: {
  onLogin: (user: GoogleUser) => void;
}) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!CLIENT_ID || !buttonRef.current) return;

    function render() {
      if (!window.google || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID!,
        callback: async ({ credential }) => {
          try {
            const res = await fetch("/api/auth/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ credential }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            onLogin(data);
          } catch {
            setError("Não foi possível entrar com o Google. Tente novamente.");
          }
        },
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "continue_with",
        locale: "pt-BR",
        width: 280,
      });
    }

    if (window.google) {
      render();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = render;
    document.head.appendChild(script);
  }, [onLogin]);

  if (!CLIENT_ID) return null;

  return (
    <div>
      <div ref={buttonRef} className="flex justify-center sm:justify-start" />
      {error && <p className="mt-2 text-xs text-rose">{error}</p>}
    </div>
  );
}
