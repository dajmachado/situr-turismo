"use client";

import { Calendar } from "lucide-react";

function toIso(br: string): string {
  const m = br.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
}

function toBr(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}

/**
 * Campo de data híbrido: dá para digitar livremente (dd/mm/aaaa) ou clicar
 * no ícone de calendário e escolher a data. Guarda sempre no formato brasileiro.
 */
export default function DateField({
  value,
  onChange,
  className,
  placeholder = "dd/mm/aaaa",
}: {
  value: string;
  onChange: (value: string) => void;
  className: string;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <input
        className={`${className} pr-11`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode="numeric"
      />
      <div className="pointer-events-none absolute inset-y-0 right-0 flex w-11 items-center justify-center text-graphite/45">
        <Calendar size={16} />
      </div>
      {/* Input de data transparente sobre o ícone: abre o calendário nativo */}
      <input
        type="date"
        aria-label="Escolher no calendário"
        value={toIso(value)}
        onChange={(e) => onChange(toBr(e.target.value))}
        className="absolute inset-y-0 right-0 w-11 cursor-pointer opacity-0"
      />
    </div>
  );
}
