import nodemailer from "nodemailer";
import { buildConfirmationText, seatsDescription } from "./confirmation-message";
import type { ConfirmationInfo } from "./confirmation-message";
import { siteConfig } from "./site-config";
import { formatPrice } from "./utils";

export type { ConfirmationInfo } from "./confirmation-message";
export { confirmationWhatsAppLink } from "./confirmation-message";

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  );
}

export function isWhatsAppApiConfigured(): boolean {
  return Boolean(
    process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID
  );
}

let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!cachedTransporter) {
    const port = Number(process.env.SMTP_PORT) || 587;
    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return cachedTransporter;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildEmailHtml(info: ConfirmationInfo): string {
  const first = info.name.split(" ")[0];
  return `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#211d1d">
      <div style="background:#b5766b;padding:24px;border-radius:16px 16px 0 0;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:20px">SITUR Turismo</h1>
      </div>
      <div style="border:1px solid #eee;border-top:none;padding:28px;border-radius:0 0 16px 16px">
        <p style="font-size:16px">Olá, <strong>${escapeHtml(first)}</strong>! ✅</p>
        <p>Sua reserva na <strong>${escapeHtml(info.tripTitle)}</strong> está confirmada.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
          <tr><td style="padding:6px 0;color:#777">Data</td><td style="padding:6px 0;text-align:right"><strong>${escapeHtml(info.tripDate)}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#777">${info.seats?.length ? "Poltronas" : "Passageiros"}</td><td style="padding:6px 0;text-align:right"><strong>${escapeHtml(seatsDescription(info))}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#777">Valor</td><td style="padding:6px 0;text-align:right"><strong>${escapeHtml(formatPrice(info.amount))}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#777">Referência</td><td style="padding:6px 0;text-align:right">${escapeHtml(info.reference)}</td></tr>
        </table>
        <p style="font-size:13px;color:#666">Qualquer dúvida, fale com a gente pelo WhatsApp: ${siteConfig.whatsappDisplay}</p>
        <p style="font-size:13px;color:#999;margin-top:24px">— Equipe SITUR Turismo</p>
      </div>
    </div>
  `;
}

/** Envia o e-mail de confirmação. Retorna false silenciosamente se não configurado. */
export async function sendConfirmationEmail(
  info: ConfirmationInfo
): Promise<boolean> {
  if (!isEmailConfigured() || !info.email) return false;
  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: info.email,
      subject: `Reserva confirmada — ${info.tripTitle}`,
      text: buildConfirmationText(info),
      html: buildEmailHtml(info),
    });
    return true;
  } catch (error) {
    console.error("Falha ao enviar e-mail de confirmação:", error);
    return false;
  }
}

/** Envia via WhatsApp Cloud API (Meta), se configurada. */
export async function sendConfirmationWhatsAppApi(
  info: ConfirmationInfo
): Promise<boolean> {
  if (!isWhatsAppApiConfigured() || !info.phone) return false;
  const digits = info.phone.replace(/\D/g, "");
  if (!digits) return false;
  const to = digits.startsWith("55") ? digits : `55${digits}`;
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: buildConfirmationText(info) },
        }),
      }
    );
    if (!res.ok) {
      console.error("WhatsApp Cloud API retornou erro:", await res.text());
    }
    return res.ok;
  } catch (error) {
    console.error("Falha ao enviar WhatsApp de confirmação:", error);
    return false;
  }
}

/**
 * Dispara a confirmação por todos os canais disponíveis (e-mail sempre que
 * configurado; WhatsApp automático apenas se a Cloud API estiver configurada
 * — caso contrário, fica disponível como link manual na tela do admin).
 * Nunca lança erro: falha de notificação não pode derrubar o fluxo de pagamento.
 */
export async function sendReservationConfirmation(
  info: ConfirmationInfo
): Promise<void> {
  await Promise.allSettled([
    sendConfirmationEmail(info),
    sendConfirmationWhatsAppApi(info),
  ]);
}
