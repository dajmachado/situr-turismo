"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { GalleryItem } from "@/lib/types";
import Reveal from "./Reveal";

export default function PhotoMasonry({ items }: { items: GalleryItem[] }) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (lightbox === null) return;
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((i) => ((i ?? 0) + 1) % items.length);
      if (e.key === "ArrowLeft")
        setLightbox((i) => ((i ?? 0) - 1 + items.length) % items.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, items.length]);

  return (
    <>
      <div className="columns-2 gap-4 md:columns-3 [&>div]:mb-4">
        {items.map((item, i) => (
          <Reveal key={item.id} delay={(i % 3) * 0.08}>
            <button
              onClick={() => setLightbox(i)}
              className="group relative block w-full overflow-hidden rounded-2xl"
            >
              <Image
                src={item.image}
                alt={item.caption ?? "Foto da galeria SITUR"}
                width={600}
                height={i % 3 === 0 ? 760 : 450}
                className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-graphite/70 via-transparent to-transparent p-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                <p className="text-left text-sm font-medium text-white">
                  {item.caption}
                </p>
              </div>
            </button>
          </Reveal>
        ))}
      </div>

      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-graphite/90 p-4 backdrop-blur-lg"
            onClick={() => setLightbox(null)}
          >
            <button
              aria-label="Fechar"
              className="absolute right-6 top-6 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white hover:text-graphite"
            >
              <X size={20} />
            </button>
            <button
              aria-label="Anterior"
              onClick={(e) => {
                e.stopPropagation();
                setLightbox((i) => ((i ?? 0) - 1 + items.length) % items.length);
              }}
              className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white hover:text-graphite"
            >
              <ChevronLeft size={20} />
            </button>
            <motion.div
              key={lightbox}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
              className="relative max-h-[85vh] w-full max-w-4xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={items[lightbox].image}
                alt={items[lightbox].caption ?? "Foto da galeria SITUR"}
                width={1400}
                height={900}
                className="max-h-[80vh] w-full rounded-2xl object-contain"
              />
              {items[lightbox].caption && (
                <p className="mt-4 text-center text-sm text-white/80">
                  {items[lightbox].caption}
                </p>
              )}
            </motion.div>
            <button
              aria-label="Próxima"
              onClick={(e) => {
                e.stopPropagation();
                setLightbox((i) => ((i ?? 0) + 1) % items.length);
              }}
              className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white hover:text-graphite"
            >
              <ChevronRight size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
