"use client";

import { useRef, useState } from "react";
import { Upload, Link2, Loader2 } from "lucide-react";

export default function ImageUploader({
  onUploaded,
  label = "Adicionar imagem",
}: {
  onUploaded: (url: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");

  async function handleFile(file: File) {
    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro no upload");
      onUploaded(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro no upload");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function addUrl() {
    if (!url.trim()) return;
    onUploaded(url.trim());
    setUrl("");
  }

  return (
    <div className="rounded-2xl border border-dashed border-graphite/20 bg-blush-light/50 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-graphite/55">
        {label}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center justify-center gap-2 rounded-xl bg-rose px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-rose-dark disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Upload size={14} />
          )}
          {uploading ? "Enviando..." : "Enviar arquivo"}
        </button>
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Link2
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-graphite/40"
            />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addUrl();
                }
              }}
              placeholder="ou cole a URL de uma imagem"
              className="w-full rounded-xl border border-graphite/15 bg-white py-2.5 pl-9 pr-3 text-xs outline-none focus:border-rose"
            />
          </div>
          <button
            type="button"
            onClick={addUrl}
            className="rounded-xl border border-graphite/15 bg-white px-4 py-2.5 text-xs font-semibold text-graphite/70 transition-colors hover:border-rose hover:text-rose"
          >
            Adicionar
          </button>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-rose">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
