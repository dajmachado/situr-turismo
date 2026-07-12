"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { whatsappLink } from "@/lib/site-config";

const links = [
  { href: "/", label: "Home" },
  { href: "/viagens", label: "Próximas Viagens" },
  { href: "/roteiros", label: "Roteiros" },
  { href: "/sobre", label: "Sobre" },
  { href: "/#depoimentos", label: "Depoimentos" },
  { href: "/contato", label: "Contato" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const hasDarkHero = pathname === "/" || pathname.startsWith("/viagens/");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = scrolled || open || !hasDarkHero;

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-500 ${
        solid
          ? "border-b border-graphite/5 bg-ice/85 shadow-soft backdrop-blur-xl"
          : "bg-transparent"
      } ${hasDarkHero && !solid ? "-mb-[72px]" : ""}`}
    >
      <nav className="container-site flex h-[72px] items-center justify-between">
        <Link href="/" className="group flex items-baseline gap-1">
          <span
            className={`font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight transition-colors ${
              solid ? "text-graphite" : "text-white"
            }`}
          >
            SITUR
          </span>
          <span
            className={`text-[10px] font-semibold uppercase tracking-[0.35em] transition-colors ${
              solid ? "text-gold-dark" : "text-gold-light"
            }`}
          >
            Turismo
          </span>
        </Link>

        <ul className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`relative text-[13px] font-medium tracking-wide transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-gold after:transition-all after:duration-300 hover:after:w-full ${
                  solid
                    ? "text-graphite/80 hover:text-graphite"
                    : "text-white/85 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden lg:block">
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className={solid ? "btn-primary !px-6 !py-2.5" : "btn-ghost !px-6 !py-2.5"}
          >
            Reservar agora
          </a>
        </div>

        <button
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          onClick={() => setOpen(!open)}
          className={`lg:hidden ${solid ? "text-graphite" : "text-white"}`}
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden border-t border-graphite/5 bg-ice/95 backdrop-blur-xl lg:hidden"
          >
            <ul className="container-site flex flex-col gap-1 py-4">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-4 py-3 text-sm font-medium text-graphite/85 transition-colors hover:bg-blush hover:text-rose-dark"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="mt-2 px-4 pb-2">
                <a
                  href={whatsappLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full"
                >
                  Reservar agora
                </a>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
