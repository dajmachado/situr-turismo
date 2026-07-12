import Link from "next/link";
import Image from "next/image";
import Reveal from "./Reveal";
import { whatsappLink } from "@/lib/site-config";

export default function CtaBanner({
  title = "Sua próxima viagem começa aqui.",
  subtitle = "Descubra nossos próximos destinos e reserve sua vaga antes que acabem.",
  image = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1920&auto=format&fit=crop",
}: {
  title?: string;
  subtitle?: string;
  image?: string;
}) {
  return (
    <section className="container-site py-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2.5rem] shadow-lifted">
          <Image
            src={image}
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-graphite/85 via-graphite/60 to-rose-deep/50" />
          <div className="relative flex flex-col items-start gap-6 px-8 py-16 sm:px-14 lg:flex-row lg:items-center lg:justify-between lg:px-20">
            <div className="max-w-xl">
              <h2 className="font-[family-name:var(--font-display)] text-3xl font-medium leading-tight text-white sm:text-4xl">
                {title}
              </h2>
              <p className="mt-3 text-white/75">{subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/viagens" className="btn-gold whitespace-nowrap">
                Ver próximas viagens
              </Link>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost whitespace-nowrap"
              >
                Reservar minha vaga
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
