// Mensagem clara pra quando a sessão do admin expira no meio de uma ação —
// antes disso, o erro cru "Não autorizado" (vindo do middleware.ts) aparecia
// sem explicação nenhuma dentro dos modais, confundindo a equipe do balcão
// (ver caso da Sandra, 11/08/2026: sessão expirou com uma venda já
// preenchida e ela não entendia por que não salvava).
export const SESSION_EXPIRED_MESSAGE =
  "Sua sessão expirou. Abra o painel em outra aba, faça login de novo lá e volte pra cá — os dados que você já preencheu continuam aqui, é só clicar em salvar de novo.";

/**
 * Lê a mensagem de erro de uma resposta de API do admin, trocando o "Não
 * autorizado" cru por uma explicação acionável quando a sessão expirou.
 */
export async function adminErrorMessage(
  res: Response,
  fallback: string
): Promise<string> {
  if (res.status === 401) return SESSION_EXPIRED_MESSAGE;
  const data = await res.json().catch(() => ({}));
  return data.error ?? fallback;
}
