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

/** Bolinha com o número de itens do carrinho */
function Contador({ n }: { n: number }) {
  return (
    <span className="ml-1 inline-grid min-w-5 place-items-center rounded-full bg-marca-600 px-1 text-[11px] leading-5 font-bold text-white">
      {n > 99 ? "99+" : n}
    </span>
  );
}

function estaAtivo(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Cabeçalho. "nomeUsuario" vem do servidor: null quando ninguém está logado. */
export function Cabecalho({
  nomeUsuario,
  itensNoCarrinho,
}: {
  nomeUsuario: string | null;
  itensNoCarrinho: number;
}) {
  const pathname = usePathname();
  const primeiroNome = nomeUsuario?.split(" ")[0];
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
              {href === "/carrinho" && itensNoCarrinho > 0 && <Contador n={itensNoCarrinho} />}
            </Link>
          ))}
        </nav>
        {primeiroNome ? (
          <Link href="/conta" className="text-sm font-medium text-slate-600 md:hidden">
            Olá, <span className="font-bold text-slate-900">{primeiroNome}</span>
          </Link>
        ) : (
          <Link
            href="/entrar"
            className="rounded-lg bg-marca-600 px-4 py-2 text-sm font-semibold text-white hover:bg-marca-700 md:hidden"
          >
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}

export function BarraInferior({ itensNoCarrinho }: { itensNoCarrinho: number }) {
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
                <span className="relative">
                  <Icone className="h-6 w-6" strokeWidth={ativo ? 2.5 : 2} />
                  {href === "/carrinho" && itensNoCarrinho > 0 && (
                    <span className="absolute -top-1.5 -right-2.5">
                      <Contador n={itensNoCarrinho} />
                    </span>
                  )}
                </span>
                {rotulo.split(" ")[0]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
