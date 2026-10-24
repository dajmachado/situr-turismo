import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  experimental: {
    // Com middleware ativo (middleware.ts protege /api/admin), o Next guarda
    // só os primeiros 10 MB do corpo de cada requisição e descarta o resto
    // em silêncio — o upload de foto grande ou de vídeo chegaria cortado.
    middlewareClientMaxBodySize: "100mb",
  },
};

export default nextConfig;
