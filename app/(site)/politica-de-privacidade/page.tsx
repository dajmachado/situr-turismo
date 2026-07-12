import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Saiba como a SITUR Turismo coleta, utiliza e protege seus dados pessoais, em conformidade com a LGPD.",
  alternates: { canonical: "/politica-de-privacidade" },
};

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        label="LGPD"
        title="Política de Privacidade"
        subtitle="Transparência no tratamento dos seus dados, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018)."
      />
      <section className="container-site max-w-3xl py-16">
        <div className="space-y-8 text-sm leading-relaxed text-graphite/70 [&_h2]:font-[family-name:var(--font-display)] [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-graphite">
          <div>
            <h2>1. Dados que coletamos</h2>
            <p className="mt-2">
              Coletamos apenas os dados necessários para a prestação dos nossos
              serviços: nome, documento de identificação, telefone, e-mail e
              informações de pagamento no momento da reserva.
            </p>
          </div>
          <div>
            <h2>2. Como utilizamos seus dados</h2>
            <p className="mt-2">
              Seus dados são utilizados exclusivamente para: emissão de
              contratos e seguros de viagem, comunicação sobre a excursão
              contratada, e envio de novidades mediante seu consentimento.
            </p>
          </div>
          <div>
            <h2>3. Compartilhamento</h2>
            <p className="mt-2">
              Compartilhamos dados apenas com parceiros essenciais à operação
              da viagem (hotéis, seguradoras e parques), sempre limitados ao
              necessário.
            </p>
          </div>
          <div>
            <h2>4. Seus direitos</h2>
            <p className="mt-2">
              Você pode solicitar a qualquer momento o acesso, correção ou
              exclusão dos seus dados pessoais através do nosso e-mail de
              contato. Responderemos em até 15 dias úteis.
            </p>
          </div>
          <div>
            <h2>5. Segurança</h2>
            <p className="mt-2">
              Adotamos medidas técnicas e organizacionais para proteger seus
              dados contra acessos não autorizados, perda ou alteração
              indevida.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
