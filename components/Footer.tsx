import Link from "next/link";
import { MapPin, Mail, Phone, Instagram, Facebook, ShieldCheck } from "lucide-react";
import { siteConfig, whatsappLink } from "@/lib/site-config";

export default function Footer() {
  return (
    <footer className="bg-graphite text-white/70">
      <div className="container-site grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="font-[family-name:var(--font-display)] text-3xl font-semibold text-white">
              SITUR
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-gold-light">
              Turismo
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            Há mais de uma década transformando viagens em experiências
            inesquecíveis, com segurança, conforto e atendimento humanizado.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <a
              href={siteConfig.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 transition-all hover:border-gold hover:bg-gold hover:text-graphite"
            >
              <Instagram size={16} />
            </a>
            <a
              href={siteConfig.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 transition-all hover:border-gold hover:bg-gold hover:text-graphite"
            >
              <Facebook size={16} />
            </a>
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 transition-all hover:border-gold hover:bg-gold hover:text-graphite"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
          </div>
        </div>

        <div>
          <h3 className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-white">
            Navegação
          </h3>
          <ul className="space-y-3 text-sm">
            <li><Link href="/" className="transition-colors hover:text-gold-light">Home</Link></li>
            <li><Link href="/viagens" className="transition-colors hover:text-gold-light">Próximas Viagens</Link></li>
            <li><Link href="/roteiros" className="transition-colors hover:text-gold-light">Roteiros</Link></li>
            <li><Link href="/sobre" className="transition-colors hover:text-gold-light">Sobre</Link></li>
            <li><Link href="/contato" className="transition-colors hover:text-gold-light">Contato</Link></li>
            <li><Link href="/minhas-reservas" className="transition-colors hover:text-gold-light">Minhas Reservas</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-white">
            Contato
          </h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2.5">
              <MapPin size={15} className="mt-0.5 shrink-0 text-gold" />
              {siteConfig.address}
            </li>
            <li className="flex items-center gap-2.5">
              <Phone size={15} className="shrink-0 text-gold" />
              {siteConfig.phone}
            </li>
            <li className="flex items-center gap-2.5">
              <Phone size={15} className="shrink-0 text-gold" />
              {siteConfig.phone2}
            </li>
            <li className="flex items-center gap-2.5">
              <Mail size={15} className="shrink-0 text-gold" />
              {siteConfig.email}
            </li>
            <li className="flex items-center gap-2.5 text-gold-light">
              <ShieldCheck size={15} className="shrink-0 text-gold" />
              {siteConfig.registrationLabel}
            </li>
            <li className="pl-[26px] text-white/50">{siteConfig.cnpjNumber}</li>
          </ul>
        </div>

        <div>
          <h3 className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-white">
            Onde estamos
          </h3>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <iframe
              src={siteConfig.mapEmbedUrl}
              title="Mapa — SITUR Turismo"
              className="h-44 w-full grayscale transition-all duration-500 hover:grayscale-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-site flex flex-col items-center justify-between gap-3 py-6 text-xs text-white/40 md:flex-row">
          <p>
            © {new Date().getFullYear()} SITUR Turismo. Todos os direitos
            reservados.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/politica-de-privacidade" className="transition-colors hover:text-gold-light">
              Política de Privacidade
            </Link>
            <Link href="/politica-de-privacidade" className="transition-colors hover:text-gold-light">
              LGPD
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
