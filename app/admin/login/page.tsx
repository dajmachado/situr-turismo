"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setError("Senha incorreta. Tente novamente.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-graphite px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-[family-name:var(--font-display)] text-4xl font-semibold text-white">
            SITUR
          </p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.4em] text-gold-light">
            Painel Administrativo
          </p>
        </div>
        <form
          onSubmit={submit}
          className="rounded-3xl bg-white p-8 shadow-lifted"
        >
          <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-graphite/60">
            <Lock size={13} />
            Senha de acesso
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoFocus
            className="w-full rounded-xl border border-graphite/15 px-4 py-3 text-sm outline-none transition-colors focus:border-rose"
          />
          {error && <p className="mt-3 text-xs text-rose">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="btn-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-white/40">
          Acesso restrito à equipe SITUR
        </p>
      </div>
    </div>
  );
}
