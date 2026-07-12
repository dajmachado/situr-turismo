import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://siturturismo.com.br"),
  title: {
    default: "SITUR Turismo — Excursões e viagens inesquecíveis",
    template: "%s | SITUR Turismo",
  },
  description:
    "Excursões com conforto, segurança e atendimento humanizado. Empresa regularizada no Cadastur, ônibus executivos e roteiros inesquecíveis pelo Brasil.",
  keywords: [
    "excursão",
    "viagem",
    "turismo",
    "Oktoberfest",
    "Fazzenda Park Hotel",
    "agência de turismo",
    "Santa Catarina",
  ],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "SITUR Turismo",
    title: "SITUR Turismo — Excursões e viagens inesquecíveis",
    description:
      "Excursões com conforto, segurança e atendimento humanizado. Sua próxima viagem começa aqui.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop",
        width: 1200,
        height: 630,
        alt: "SITUR Turismo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SITUR Turismo — Excursões e viagens inesquecíveis",
    description:
      "Excursões com conforto, segurança e atendimento humanizado. Sua próxima viagem começa aqui.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${playfair.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
