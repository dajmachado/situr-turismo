"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";
import type { Testimonial } from "@/lib/types";
import SectionHeading from "./SectionHeading";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={15}
          className={
            i < rating ? "fill-gold text-gold" : "fill-graphite/10 text-graphite/10"
          }
        />
      ))}
    </div>
  );
}

export default function Testimonials({ items }: { items: Testimonial[] }) {
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(3);

  useEffect(() => {
    const update = () => {
      setPerPage(window.innerWidth < 768 ? 1 : window.innerWidth < 1100 ? 2 : 3);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const pages = Math.max(1, Math.ceil(items.length / perPage));
  const next = useCallback(() => setPage((p) => (p + 1) % pages), [pages]);

  useEffect(() => {
    const t = setInterval(next, 7000);
    return () => clearInterval(t);
  }, [next]);

  const visible = items.slice(page * perPage, page * perPage + perPage);

  return (
    <section id="depoimentos" className="scroll-mt-24 bg-ice py-24">
      <div className="container-site">
        <SectionHeading
          label="Depoimentos"
          title="Quem viaja com a SITUR, recomenda"
          subtitle="Avaliações reais de quem já viveu essa experiência — nota 4,9 no Google Reviews."
        />

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {visible.map((t) => (
                <div
                  key={t.id}
                  className="card-hover relative flex h-full flex-col rounded-3xl bg-white p-8 shadow-soft"
                >
                  <Quote
                    size={40}
                    className="absolute right-6 top-6 text-blush"
                    strokeWidth={1.2}
                  />
                  <Stars rating={t.rating} />
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-graphite/70">
                    “{t.text}”
                  </p>
                  <div className="mt-6 flex items-center gap-3 border-t border-graphite/8 pt-5">
                    <Image
                      src={t.avatar}
                      alt={t.name}
                      width={44}
                      height={44}
                      className="rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-semibold text-graphite">
                        {t.name}
                      </p>
                      <p className="text-xs text-gold-dark">{t.trip}</p>
                    </div>
                    <svg
                      className="ml-auto"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      aria-label="Google Review"
                    >
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>

          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              onClick={() => setPage((p) => (p - 1 + pages) % pages)}
              aria-label="Depoimentos anteriores"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-graphite/10 bg-white text-graphite transition-all hover:border-rose hover:bg-rose hover:text-white"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex gap-2">
              {Array.from({ length: pages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  aria-label={`Página ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === page ? "w-8 bg-gold" : "w-2 bg-graphite/15"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={next}
              aria-label="Próximos depoimentos"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-graphite/10 bg-white text-graphite transition-all hover:border-rose hover:bg-rose hover:text-white"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
