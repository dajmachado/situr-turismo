import { siteConfig } from "./site-config";
import { formatPrice } from "./utils";

// Sem dependências Node (nodemailer etc.) — pode ser importado tanto no
// servidor quanto em componentes client-side (ex.: botão de reenvio manual).

export type ConfirmationInfo = {
  name: string;
  email?: string;
  phone?: string;
  tripTitle: string;
  tripDate: string;
  seats?: string[];
  passengers: number;
  amount: number;
  reference: string;
};

export function seatsDescription(info: ConfirmationInfo): string {
  if (info.seats?.length) {
    const numbers = info.seats.map((s) => s.split("-").pop()).join(", ");
    return info.seats.length === 1
      ? `Poltrona ${numbers}`
      : `Poltronas ${numbers}`;
  }
  return `${info.passengers} ${info.passengers === 1 ? "passageiro" : "passageiros"}`;
}

export function buildConfirmationText(info: ConfirmationInfo): string {
  const first = info.name.split(" ")[0];
  return [
    `Olá, ${first}! ✅`,
    ``,
    `Sua reserva na ${info.tripTitle} está confirmada.`,
    ``,
    `Data: ${info.tripDate}`,
    seatsDescription(info),
    `Valor: ${formatPrice(info.amount)}`,
    `Referência: ${info.reference}`,
    ``,
    `Qualquer dúvida, fale com a gente: ${siteConfig.whatsappDisplay}`,
    `— Equipe SITUR Turismo`,
  ].join("\n");
}

/**
 * Link wa.me pronto com a mensagem de confirmação para o telefone do
 * PASSAGEIRO (não o número da SITUR) — usado como botão manual no admin
 * para reenviar/enviar a confirmação com um clique.
 */
export function confirmationWhatsAppLink(info: ConfirmationInfo): string | null {
  if (!info.phone) return null;
  const digits = info.phone.replace(/\D/g, "");
  if (!digits) return null;
  const to = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${to}?text=${encodeURIComponent(buildConfirmationText(info))}`;
}
