"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AbasLoja({ novos }: { novos: number }) {
  const pathname = usePathname();
  const abas = [
    { href: "/loja", rotulo: "Início" },
    { href: "/loja/pedidos", rotulo: "Pedidos" },
    { href: "/loja/produtos", rotulo: "Produtos" },
  ];
  return (
    <nav className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1" aria-label="Painel da loja">
      {abas.map((a) => {
        const ativo = a.href === "/loja" ? pathname === "/loja" : pathname.startsWith(a.href);
        return (
          <Link
            key={a.href}
            href={a.href}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold ${
              ativo ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
            }`}
          >
            {a.rotulo}
            {a.href === "/loja/pedidos" && novos > 0 && (
              <span className="rounded-full bg-red-600 px-1.5 text-xs leading-5 text-white">{novos}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
