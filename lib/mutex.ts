// Serializa operações concorrentes de leitura-modificação-escrita sobre o
// mesmo arquivo JSON (ex.: duas baixas de parcela clicadas quase juntas),
// para que uma não sobrescreva a outra. Simples fila de promises em memória
// — suficiente para um app Next.js de processo único como este.
const queues = new Map<string, Promise<unknown>>();

export function withFileLock<T>(key: string, task: () => Promise<T>): Promise<T> {
  const previous = queues.get(key) ?? Promise.resolve();
  const result = previous.then(task, task);
  queues.set(key, result.catch(() => undefined));
  return result;
}
