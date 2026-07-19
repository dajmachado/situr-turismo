"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Bus,
  Images,
  GalleryHorizontal,
  Ticket,
  UsersRound,
  CreditCard,
  LogOut,
  ExternalLink,
  Menu,
  Store,
  Settings,
  X,
} from "lucide-react";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/venda-balcao", label: "Venda no Balcão", icon: Store },
  { href: "/admin/viagens", label: "Viagens", icon: Bus },
  { href: "/admin/reservas", label: "Reservas Online", icon: Ticket },
  { href: "/admin/parcelamentos", label: "Parcelamentos", icon: CreditCard },
  { href: "/admin/clientes", label: "Clientes", icon: UsersRound },
  { href: "/admin/banners", label: "Banners do Carrossel", icon: GalleryHorizontal },
  { href: "/admin/galeria", label: "Galeria do Site", icon: Images },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Fecha o menu ao trocar de página (evita ficar aberto por engano)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  const navLinks = (
    <>
      <nav className="flex-1 space-y-1 px-3">
        {links.map((link) => {
          const active =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                active
                  ? "bg-rose text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <link.icon size={17} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-white/10 px-3 py-4">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ExternalLink size={17} />
          Ver o site
        </a>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut size={17} />
          Sair
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-ice lg:flex">
      {/* Topo fixo — só em telas menores que lg */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-graphite/8 bg-graphite px-4 py-3.5 text-white lg:hidden">
        <div className="flex items-baseline gap-1">
          <span className="font-[family-name:var(--font-display)] text-xl font-semibold">
            SITUR
          </span>
          <span className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-light">
            Admin
          </span>
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-white/80 hover:bg-white/10"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Overlay escurecido atrás do menu, em telas menores que lg */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-graphite/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar — drawer deslizante no mobile, fixa a partir de lg */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-graphite text-white transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:z-30 lg:h-screen lg:w-64 lg:max-w-none lg:translate-x-0 lg:border-r lg:border-graphite/8 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-6">
          <div className="flex items-baseline gap-1">
            <span className="font-[family-name:var(--font-display)] text-2xl font-semibold">
              SITUR
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-light">
              Admin
            </span>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white/60 hover:bg-white/10 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>
        {navLinks}
      </aside>

      <main className="min-h-screen flex-1 p-4 sm:p-6 lg:p-10">{children}</main>
    </div>
  );
}
