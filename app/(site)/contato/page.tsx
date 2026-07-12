import type { Metadata } from "next";
import { Phone, Mail, MapPin, Instagram, Facebook, ShieldCheck } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import { siteConfig, whatsappLink } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Fale com a SITUR Turismo por telefone, WhatsApp, e-mail ou redes sociais. Atendimento humanizado de verdade.",
  alternates: { canonical: "/contato" },
};

const channels = [
  {
    icon: Phone,
    title: "Segundo contato",
    value: siteConfig.phone2,
    href: `tel:${siteConfig.phone2.replace(/\D/g, "")}`,
  },
  {
    icon: Mail,
    title: "E-mail",
    value: siteConfig.email,
    href: `mailto:${siteConfig.email}`,
  },
  {
    icon: Instagram,
    title: "Instagram",
    value: "@situr.sc",
    href: siteConfig.instagram,
  },
  {
    icon: Facebook,
    title: "Facebook",
    value: "@situr.sc",
    href: siteConfig.facebook,
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHeader
        label="Contato"
        title="Vamos planejar sua próxima viagem?"
        subtitle="Nossa equipe responde rápido e com todo o carinho que você merece."
      />

      <section className="container-site grid gap-12 py-20 lg:grid-cols-2">
        <div>
          <Reveal>
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="card-hover group flex items-center gap-5 rounded-3xl bg-[#25D366] p-8 text-white shadow-soft"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </span>
              <div>
                <p className="text-lg font-semibold">WhatsApp — resposta rápida</p>
                <p className="text-sm text-white/85">{siteConfig.whatsappDisplay}</p>
              </div>
            </a>
          </Reveal>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {channels.map((channel, i) => (
              <Reveal key={channel.title} delay={i * 0.08}>
                <a
                  href={channel.href}
                  target={channel.href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="card-hover group flex h-full flex-col rounded-3xl bg-white p-7 shadow-soft"
                >
                  <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blush text-rose-dark transition-colors group-hover:bg-rose group-hover:text-white">
                    <channel.icon size={20} />
                  </span>
                  <p className="text-sm font-semibold text-graphite">{channel.title}</p>
                  <p className="mt-1 text-sm text-graphite/55">{channel.value}</p>
                </a>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.2}>
            <div className="mt-6 flex items-start gap-4 rounded-3xl border border-gold/25 bg-gold/8 p-7">
              <ShieldCheck size={22} className="mt-0.5 shrink-0 text-gold-dark" />
              <div className="text-sm leading-relaxed text-graphite/70">
                <p className="font-semibold text-graphite">Empresa regularizada</p>
                <p className="mt-1">{siteConfig.registrationLabel}</p>
                <p>{siteConfig.cnpjNumber}</p>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal direction="left">
          <div className="h-full">
            <div className="flex items-center gap-2.5 rounded-t-3xl bg-white px-7 py-5 shadow-soft">
              <MapPin size={17} className="text-rose" />
              <p className="text-sm font-medium text-graphite/75">{siteConfig.address}</p>
            </div>
            <div className="h-[420px] overflow-hidden rounded-b-3xl shadow-soft lg:h-[calc(100%-64px)]">
              <iframe
                src={siteConfig.mapEmbedUrl}
                title="Mapa — SITUR Turismo"
                className="h-full w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
