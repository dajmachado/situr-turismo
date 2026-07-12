"use client";

import { useEffect, useState } from "react";

function centsToBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Campo de valor em reais com máscara (digita-se como calculadora:
 * cada dígito entra pela direita, ex.: "48990" → "489,90").
 * `value`/`onChange` trabalham em reais (número), não em centavos.
 */
export default function CurrencyInput({
  value,
  onChange,
  className,
  placeholder = "0,00",
}: {
  value: number;
  onChange: (value: number) => void;
  className: string;
  placeholder?: string;
}) {
  const [display, setDisplay] = useState(() =>
    value ? centsToBRL(Math.round(value * 100)) : ""
  );

  // Mantém sincronizado quando o valor muda por fora (ex.: reset do formulário)
  useEffect(() => {
    const cents = Math.round((value || 0) * 100);
    setDisplay(cents ? centsToBRL(cents) : "");
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "");
    const cents = digits ? parseInt(digits, 10) : 0;
    setDisplay(cents ? centsToBRL(cents) : "");
    onChange(cents / 100);
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-graphite/45">
        R$
      </span>
      <input
        className={`${className} pl-10`}
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        inputMode="decimal"
      />
    </div>
  );
}
