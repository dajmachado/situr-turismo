import {
  ShieldCheck,
  BadgeCheck,
  Bus,
  CreditCard,
  Users,
  HeartHandshake,
} from "lucide-react";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";

const items = [
  {
    icon: BadgeCheck,
    title: "Empresa Regularizada",
    text: "Registro ativo no Cadastur e todas as licenças exigidas pelo Ministério do Turismo.",
  },
  {
    icon: ShieldCheck,
    title: "Segurança em primeiro lugar",
    text: "Motoristas experientes e frota revisada antes de cada saída.",
  },
  {
    icon: Bus,
    title: "Ônibus Confortáveis",
    text: "Poltronas reclináveis, ar-condicionado, Wi-Fi e espaço de sobra para viajar relaxado.",
  },
  {
    icon: CreditCard,
    title: "Parcelamento facilitado",
    text: "Pague em até 10x sem juros no cartão ou ganhe desconto à vista no Pix.",
  },
  {
    icon: Users,
    title: "Equipe Experiente",
    text: "Guias credenciados e apaixonados por viagens acompanham cada excursão.",
  },
  {
    icon: HeartHandshake,
    title: "Atendimento Humanizado",
    text: "Do primeiro contato ao retorno para casa, você fala com gente de verdade.",
  },
];

export default function Differentials() {
  return (
    <section className="bg-blush-light py-24">
      <div className="container-site">
        <SectionHeading
          label="Por que a SITUR"
          title="Viajar bem é viajar tranquilo"
          subtitle="Cada detalhe da sua viagem é pensado para que você só se preocupe em aproveitar."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <Reveal key={item.title} delay={i * 0.08}>
              <div className="card-hover group h-full rounded-3xl bg-white p-8 shadow-soft">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blush text-rose-dark transition-all duration-500 group-hover:bg-rose group-hover:text-white group-hover:shadow-gold">
                  <item.icon size={24} strokeWidth={1.8} />
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-graphite">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-graphite/60">
                  {item.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
