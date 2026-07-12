"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Expand } from "lucide-react";

export default function TripGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  if (images.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {images.slice(0, 8).map((img, i) => (
          <button
            key={i}
            onClick={() => setLightbox(i)}
            className={`group relative overflow-hidden rounded-2xl ${
              i === 0 ? "col-span-2 row-span-2 h-full min-h-72" : "h-36 md:h-44"
            }`}
          >
            <Image
              src={img}
              alt={`${title} — foto ${i + 1}`}
              fill
              sizes={i === 0 ? "(max-width: 768px) 100vw, 50vw" : "25vw"}
              className="object-cover transition-transform duration-700 group-hover:scale-108"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-graphite/0 opacity-0 transition-all duration-300 group-hover:bg-graphite/30 group-hover:opacity-100">
              <Expand size={22} className="text-white" />
            </div>
          </button>
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
                setLightbox((i) => ((i ?? 0) - 1 + images.length) % images.length);
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
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={images[lightbox]}
                alt={`${title} — foto ${lightbox + 1}`}
                width={1400}
                height={900}
                className="max-h-[80vh] w-auto rounded-2xl object-contain"
              />
            </motion.div>
            <button
              aria-label="Próxima"
              onClick={(e) => {
                e.stopPropagation();
                setLightbox((i) => ((i ?? 0) + 1) % images.length);
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
