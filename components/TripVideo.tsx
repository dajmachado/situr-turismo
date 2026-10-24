"use client";

import { useRef, useState } from "react";
import { Play } from "lucide-react";

/**
 * Vídeo promocional da viagem. Até o clique mostra só a capa (preload
 * "metadata" busca uns poucos KB para saber o tamanho); o vídeo em si só é
 * baixado quando a pessoa aperta play — importante para quem abre o site pelo
 * celular, no 4G.
 */
export default function TripVideo({
  src,
  poster,
  title,
}: {
  src: string;
  poster?: string;
  title: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-graphite shadow-soft">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        controls={started}
        playsInline
        preload="metadata"
        onPlay={() => setStarted(true)}
        className="block h-auto w-full"
        aria-label={`Vídeo: ${title}`}
      />
      {!started && (
        <button
          type="button"
          onClick={() => {
            setStarted(true);
            videoRef.current?.play().catch(() => {});
          }}
          aria-label="Assistir ao vídeo"
          className="group absolute inset-0 flex items-center justify-center bg-graphite/25 transition-colors hover:bg-graphite/10"
        >
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/90 text-rose-dark shadow-lifted transition-transform duration-300 group-hover:scale-110 sm:h-24 sm:w-24">
            <Play size={34} className="ml-1.5" fill="currentColor" />
          </span>
          <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-graphite/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-md">
            Assista ao vídeo
          </span>
        </button>
      )}
    </div>
  );
}
