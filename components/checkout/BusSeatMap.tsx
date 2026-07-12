"use client";

import { useMemo } from "react";
import type { BusLayout } from "@/lib/bus";

type Props = {
  layout: BusLayout;
  /** Assentos destacados: selecionados (checkout) ou bloqueados (admin). */
  active: string[];
  /** Assentos indisponíveis, não clicáveis. */
  occupied: string[];
  onToggle: (seatId: string) => void;
  variant?: "checkout" | "admin";
  disabled?: boolean;
};

export default function BusSeatMap({
  layout,
  active,
  occupied,
  onToggle,
  variant = "checkout",
  disabled = false,
}: Props) {
  const activeSet = useMemo(() => new Set(active), [active]);
  const occupiedSet = useMemo(() => new Set(occupied), [occupied]);

  function seatClasses(id: string): string {
    const base =
      "flex h-9 w-9 items-center justify-center rounded-lg text-[11px] font-semibold transition-all duration-150 select-none";
    if (occupiedSet.has(id)) {
      return `${base} cursor-not-allowed bg-graphite/15 text-graphite/40 line-through`;
    }
    if (activeSet.has(id)) {
      return `${base} cursor-pointer bg-rose text-white shadow-soft scale-105`;
    }
    return `${base} cursor-pointer border border-graphite/20 bg-white text-graphite/70 hover:border-rose hover:text-rose`;
  }

  return (
    <div>
      {/* Legenda */}
      <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-graphite/60">
        <span className="flex items-center gap-1.5">
          <span className="h-4 w-4 rounded border border-graphite/20 bg-white" />
          Livre
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-4 w-4 rounded bg-rose" />
          {variant === "admin" ? "Bloqueado" : "Selecionado"}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-4 w-4 rounded bg-graphite/15" />
          {variant === "admin" ? "Vendido online" : "Ocupado"}
        </span>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        {layout.decks.map((deck, di) => (
          <div key={di}>
            {deck.name && (
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gold-dark">
                {deck.name}
              </p>
            )}
            <div className="inline-block rounded-3xl border border-graphite/10 bg-blush-light/50 p-4">
              <p className="mb-3 px-1 text-[10px] font-semibold uppercase tracking-wider text-graphite/40">
                Frente
              </p>
              <div className="space-y-2">
                {deck.rows.map((r, ri) => (
                  <div key={ri} className="flex items-center gap-2">
                    {r.map((cell, ci) => {
                      if (cell.type === "aisle") {
                        return <span key={ci} className="w-5" />;
                      }
                      if (cell.type === "empty") {
                        return <span key={ci} className="h-9 w-9" />;
                      }
                      if (cell.type === "feature") {
                        return (
                          <span
                            key={ci}
                            className={`flex h-9 items-center justify-center rounded-lg bg-graphite/8 px-1 text-[8px] font-semibold uppercase tracking-wide text-graphite/45 ${
                              cell.wide ? "w-[80px]" : "w-9"
                            }`}
                          >
                            {cell.label}
                          </span>
                        );
                      }
                      return (
                        <button
                          key={ci}
                          type="button"
                          disabled={disabled || occupiedSet.has(cell.id)}
                          onClick={() => onToggle(cell.id)}
                          className={seatClasses(cell.id)}
                          aria-label={`Poltrona ${cell.id}`}
                          aria-pressed={activeSet.has(cell.id)}
                        >
                          {cell.number}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
