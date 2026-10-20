"use client";

// Menus do site:
// - Cabeçalho (topo): logo + links (os links só aparecem em telas grandes)
// - Barra inferior: só no celular, com ícones grandes fáceis de tocar

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calculator, Home, Search, ShoppingCart, User } from "lucide-react";
import { Logo } from "./Logo";

const LINKS = [
  { href: "/", rotulo: "Início", Icone: Home },
  { href: "/busca", rotulo: "Buscar", Icone: Search },
  { href: "/calculadora", rotulo: "Calcular obra", Icone: Calculator },
  { href: "/carrinho", rotulo: "Carrinho", Icone: ShoppingCart },
  { href: "/conta", rotulo: "Conta", Icone: User },
];

function estaAtivo(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Cabecalho() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Logo />
        <nav className="hidden gap-1 md:flex">
          {LINKS.map(({ href, rotulo }) => (
            <Link
              key={href}
              href={href}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                estaAtivo(pathname, href)
                  ? "bg-marca-50 text-marca-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {rotulo}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function BarraInferior() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Menu principal"
    >
      <ul className="grid grid-cols-5">
        {LINKS.map(({ href, rotulo, Icone }) => {
          const ativo = estaAtivo(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                  ativo ? "text-marca-600" : "text-slate-500"
                }`}
              >
                <Icone className="h-6 w-6" strokeWidth={ativo ? 2.5 : 2} />
                {rotulo.split(" ")[0]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
