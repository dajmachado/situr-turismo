"use client";

import { useRef, useState } from "react";
import { Film, Loader2 } from "lucide-react";
import { SESSION_EXPIRED_MESSAGE } from "@/lib/admin-fetch";

/**
 * Envio de vídeo MP4 para /api/admin/upload. Usa XMLHttpRequest (e não
 * fetch) só para mostrar a porcentagem — vídeo de dezenas de MB pela
 * internet do balcão leva tempo, e sem progresso parece travado.
 */
export default function VideoUploader({
  onUploaded,
  label = "Enviar vídeo",
}: {
  onUploaded: (url: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");

  function handleFile(file: File) {
    setError("");
    if (file.type !== "video/mp4") {
      setError("Envie o vídeo em MP4. Vídeo de iPhone (.mov) repassado pelo WhatsApp já chega em MP4.");
      return;
    }
    const formData = new FormData();
    formData.append("kind", "video");
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/upload");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
      if (xhr.status === 401) {
        setError(SESSION_EXPIRED_MESSAGE);
        return;
      }
      let data: { url?: string; error?: string } = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && data.url) onUploaded(data.url);
      else setError(data.error ?? "Erro no envio do vídeo.");
    };
    xhr.onerror = () => {
      setProgress(null);
      setError("A conexão caiu durante o envio. Tente de novo.");
    };
    setProgress(0);
    xhr.send(formData);
  }

  return (
    <div className="rounded-2xl border border-dashed border-graphite/20 bg-blush-light/50 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-graphite/55">
        {label}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={progress !== null}
          className="flex items-center justify-center gap-2 rounded-xl bg-rose px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-rose-dark disabled:opacity-50"
        >
          {progress !== null ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Film size={14} />
          )}
          {progress !== null ? `Enviando... ${progress}%` : "Escolher vídeo (MP4)"}
        </button>
        <span className="text-[11px] text-graphite/45">
          Até 80 MB. Prefira vídeos curtos (até 1–2 minutos).
        </span>
      </div>
      {progress !== null && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-graphite/10">
          <div className="h-full bg-rose transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {error && <p className="mt-2 text-xs text-rose">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
