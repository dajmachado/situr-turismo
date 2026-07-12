"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Banner } from "@/lib/types";
import { whatsappLink } from "@/lib/site-config";

const AUTOPLAY_MS = 6500;

export default function HeroCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(
    () => setIndex((i) => (i + 1) % banners.length),
    [banners.length]
  );
  const prev = useCallback(
    () => setIndex((i) => (i - 1 + banners.length) % banners.length),
    [banners.length]
  );

  useEffect(() => {
    if (paused || banners.length <= 1) return;
    const t = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [next, paused, banners.length]);

  if (banners.length === 0) return null;
  const banner = banners[index];

  return (
    <section
      className="relative h-[92svh] min-h-[560px] w-full overflow-hidden bg-graphite"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Destaques SITUR"
    >
      <AnimatePresence mode="popLayout">
        <motion.div
          key={banner.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: 1.08 }}
            transition={{ duration: AUTOPLAY_MS / 1000 + 2, ease: "linear" }}
            className="absolute inset-0"
          >
            <Image
              src={banner.image}
              alt={banner.title}
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-cover"
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-r from-graphite/80 via-graphite/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-graphite/70 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="container-site relative z-10 flex h-full flex-col justify-center pb-24 pt-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={banner.id}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.12 } },
              exit: { opacity: 0, y: -20, transition: { duration: 0.4 } },
            }}
            className="max-w-2xl"
          >
            <motion.p
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
              }}
              className="section-label !text-gold-light"
            >
              SITUR Turismo
            </motion.p>
            <motion.h1
              variants={{
                hidden: { opacity: 0, y: 40 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.9 } },
              }}
              className="font-[family-name:var(--font-display)] text-4xl font-medium leading-[1.1] text-white sm:text-5xl lg:text-6xl"
            >
              {banner.title}
            </motion.h1>
            <motion.p
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
              }}
              className="mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg"
            >
              {banner.subtitle}
            </motion.p>
            {banner.price && (
              <motion.p
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
                }}
                className="mt-5 text-sm text-white/70"
              >
                A partir de{" "}
                <span className="font-[family-name:var(--font-display)] text-2xl font-semibold text-gold-light">
                  {banner.price}
                </span>
              </motion.p>
            )}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
              }}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              {banner.tripSlug ? (
                <Link href={`/viagens/${banner.tripSlug}`} className="btn-gold">
                  Saiba mais
                </Link>
              ) : (
                <Link href="/viagens" className="btn-gold">
                  Saiba mais
                </Link>
              )}
              {banner.tripSlug ? (
                <Link href={`/checkout/${banner.tripSlug}`} className="btn-ghost">
                  Reservar
                </Link>
              ) : (
                <a
                  href={whatsappLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost"
                >
                  Reservar
                </a>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {banners.length > 1 && (
        <>
          <div className="absolute bottom-10 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3">
            {banners.map((b, i) => (
              <button
                key={b.id}
                onClick={() => setIndex(i)}
                aria-label={`Ir para o slide ${i + 1}`}
                className="group relative h-1 w-12 overflow-hidden rounded-full bg-white/25"
              >
                {i === index && (
                  <motion.span
                    layoutId="hero-dot"
                    className="absolute inset-0 bg-gold"
                  />
                )}
              </button>
            ))}
          </div>

          <button
            onClick={prev}
            aria-label="Slide anterior"
            className="absolute left-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white hover:text-graphite md:flex"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            aria-label="Próximo slide"
            className="absolute right-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white hover:text-graphite md:flex"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}
    </section>
  );
}
