export function formatPrice(value: number): string {
  const [int, dec] = value.toFixed(2).split(".");
  const intFormatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `R$ ${intFormatted},${dec}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Normaliza horários de atividade pro formato "HH:MM" (aceito por
// <input type="time">) — cobre também os formatos antigos gravados antes
// desse campo virar um input nativo de hora (ex.: "07h00", "08h").
export function parseActivityTime(raw?: string): string {
  if (!raw) return "";
  const match = raw.trim().match(/^(\d{1,2})[h:](\d{0,2})$/i);
  if (!match) return "";
  const hours = Math.min(23, parseInt(match[1], 10));
  const minutes = match[2] ? Math.min(59, parseInt(match[2], 10)) : 0;
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return "";
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

// Atividades sem horário ficam no fim, na ordem em que já estavam
// (sort estável) — as com horário ficam em ordem crescente.
export function sortActivitiesByTime<T extends { time?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ta = a.time || "";
    const tb = b.time || "";
    if (!ta && !tb) return 0;
    if (!ta) return 1;
    if (!tb) return -1;
    return ta.localeCompare(tb);
  });
}
