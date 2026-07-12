import type { Metadata } from "next";
import Image from "next/image";
import PageHeader from "@/components/PageHeader";
import Stats from "@/components/Stats";
import Differentials from "@/components/Differentials";
import CtaBanner from "@/components/CtaBanner";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Sobre a SITUR",
  description:
    "Conheça a SITUR Turismo: mais de uma década de excursões com segurança, conforto e atendimento humanizado.",
  alternates: { canonical: "/sobre" },
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        label="Sobre nós"
        title="Apaixonados por transformar viagens em memórias"
        subtitle="Somos uma agência de turismo regularizada, com mais de uma década de estrada e milhares de viajantes felizes."
      />

      <section className="container-site grid items-center gap-14 py-20 lg:grid-cols-2">
        <Reveal direction="right">
          <div className="relative">
            <div className="overflow-hidden rounded-[2.5rem] shadow-lifted">
              <Image
                src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1200&auto=format&fit=crop"
                alt="Equipe SITUR planejando viagens"
                width={800}
                height={600}
                className="w-full object-cover"
              />
            </div>
            <div className="glass absolute -bottom-8 -right-4 hidden rounded-3xl px-8 py-6 shadow-lifted sm:block">
              <p className="font-[family-name:var(--font-display)] text-3xl font-semibold text-rose-dark">
                12 anos
              </p>
              <p className="text-xs uppercase tracking-[0.2em] text-graphite/55">
                de experiência
              </p>
            </div>
          </div>
        </Reveal>
        <Reveal direction="left">
          <div>
            <p className="section-label">Nossa história</p>
            <h2 className="heading-display !text-3xl">
              Cada viagem é planejada como se fosse a nossa
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-graphite/65">
              <p>
                A SITUR nasceu do desejo de fazer diferente: oferecer excursões
                em que o viajante só precisa se preocupar em aproveitar. Da
                escolha do hotel ao horário de cada passeio, cuidamos de todos
                os detalhes com carinho e profissionalismo.
              </p>
              <p>
                Somos registrados no Cadastur, trabalhamos com frota executiva
                revisada e guias credenciados. Ao longo de mais de uma década,
                já levamos milhares de pessoas aos destinos mais encantadores
                do Brasil — e voltamos com histórias, amizades e sorrisos.
              </p>
              <p>
                Nosso compromisso é simples: você embarca como cliente e volta
                como parte da família SITUR.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      <Stats />
      <Differentials />
      <CtaBanner
        title="Pronto para viajar com a gente?"
        subtitle="Veja as próximas saídas confirmadas e garanta a sua vaga."
      />
    </>
  );
}
