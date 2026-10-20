"use client";

// Menus do site:
// - Cabeçalho (topo): logo + links (os links só aparecem em telas grandes)
// - Barra inferior: só no celular, com ícones grandes fáceis de tocar

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Calculator, Home, Search, ShoppingCart, Store, User } from "lucide-react";
import { Logo } from "./Logo";

const LINKS_CLIENTE = [
  { href: "/", rotulo: "Início", Icone: Home },
  { href: "/busca", rotulo: "Buscar", Icone: Search },
  { href: "/calculadora", rotulo: "Calcular obra", Icone: Calculator },
  { href: "/carrinho", rotulo: "Carrinho", Icone: ShoppingCart },
  { href: "/conta", rotulo: "Conta", Icone: User },
];

/** O lojista troca calculadora e carrinho pelo painel da loja e pelos pedidos */
const LINKS_LOJISTA = [
  { href: "/", rotulo: "Início", Icone: Home },
  { href: "/busca", rotulo: "Buscar", Icone: Search },
  { href: "/loja", rotulo: "Loja", Icone: Store },
  { href: "/loja/pedidos", rotulo: "Pedidos", Icone: ClipboardList },
  { href: "/conta", rotulo: "Conta", Icone: User },
];

export type DadosMenu = {
  nomeUsuario: string | null;
  itensNoCarrinho: number;
  /** Preenchido só para lojista: pedidos com status "Novo" */
  pedidosNovos: number | null;
};

const linksDo = (menu: DadosMenu) => (menu.pedidosNovos === null ? LINKS_CLIENTE : LINKS_LOJISTA);

/** Número que aparece no ícone: itens do carrinho ou pedidos novos da loja */
function contadorDo(href: string, menu: DadosMenu) {
  if (href === "/carrinho") return menu.itensNoCarrinho;
  if (href === "/loja/pedidos") return menu.pedidosNovos ?? 0;
  return 0;
}

/** Bolinha com o número de itens do carrinho */
function Contador({ n }: { n: number }) {
  return (
    <span className="ml-1 inline-grid min-w-5 place-items-center rounded-full bg-marca-600 px-1 text-[11px] leading-5 font-bold text-white">
      {n > 99 ? "99+" : n}
    </span>
  );
}

/** O link ativo é o de endereço mais específico (ex.: /loja/pedidos ganha de /loja) */
function estaAtivo(pathname: string, href: string, links: { href: string }[]) {
  const casa = (h: string) => (h === "/" ? pathname === "/" : pathname === h || pathname.startsWith(`${h}/`));
  const maisEspecifico = links.filter((l) => casa(l.href)).sort((a, b) => b.href.length - a.href.length)[0];
  return maisEspecifico?.href === href;
}

/** Cabeçalho. "nomeUsuario" vem do servidor: null quando ninguém está logado. */
export function Cabecalho(menu: DadosMenu) {
  const pathname = usePathname();
  const primeiroNome = menu.nomeUsuario?.split(" ")[0];
  const links = linksDo(menu);
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Logo />
        <nav className="hidden gap-1 md:flex">
          {links.map(({ href, rotulo }) => (
            <Link
              key={href}
              href={href}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                estaAtivo(pathname, href, links)
                  ? "bg-marca-50 text-marca-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {rotulo}
              {contadorDo(href, menu) > 0 && <Contador n={contadorDo(href, menu)} />}
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

export function BarraInferior(menu: DadosMenu) {
  const pathname = usePathname();
  const links = linksDo(menu);
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Menu principal"
    >
      <ul className="grid grid-cols-5">
        {links.map(({ href, rotulo, Icone }) => {
          const ativo = estaAtivo(pathname, href, links);
          const contador = contadorDo(href, menu);
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
                  {contador > 0 && (
                    <span className="absolute -top-1.5 -right-2.5">
                      <Contador n={contador} />
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
