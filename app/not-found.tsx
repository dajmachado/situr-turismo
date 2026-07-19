import Link from "next/link";

// Evita que o Next cacheie estaticamente a resposta 404 — sem isso, um
// arquivo novo em public/uploads/ (enviado pelo admin em produção) continua
// retornando 404 em cache até o processo reiniciar, mesmo já existindo em
// disco.
export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ice px-4 text-center">
      <p className="section-label justify-center">Erro 404</p>
      <h1 className="heading-display">Página não encontrada</h1>
      <p className="mt-4 max-w-md text-graphite/60">
        O destino que você procura não existe ou foi movido. Que tal explorar
        nossas próximas viagens?
      </p>
      <Link href="/" className="btn-primary mt-8">
        Voltar para a Home
      </Link>
    </div>
  );
}
