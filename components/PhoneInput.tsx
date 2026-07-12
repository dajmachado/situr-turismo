"use client";

export function maskPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/** Campo de telefone com máscara brasileira (DDD) 99999-9999, aplicada ao digitar. */
export default function PhoneInput({
  value,
  onChange,
  className,
  placeholder = "(48) 99999-9999",
}: {
  value: string;
  onChange: (value: string) => void;
  className: string;
  placeholder?: string;
}) {
  return (
    <input
      className={className}
      value={value}
      onChange={(e) => onChange(maskPhone(e.target.value))}
      placeholder={placeholder}
      inputMode="tel"
      maxLength={16}
    />
  );
}
