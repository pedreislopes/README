"use client";

// Abas de navegação de um painel (loja ou administrador), com contador opcional.

import Link from "next/link";
import { usePathname } from "next/navigation";

export type Aba = { href: string; rotulo: string; contador?: number };

export function Abas({ abas, raiz, rotulo }: { abas: Aba[]; raiz: string; rotulo: string }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1" aria-label={rotulo}>
      {abas.map((a) => {
        const ativo = a.href === raiz ? pathname === raiz : pathname.startsWith(a.href);
        return (
          <Link
            key={a.href}
            href={a.href}
            className={`flex flex-1 shrink-0 items-center justify-center gap-1 rounded-lg px-2 py-2.5 text-[13px] font-semibold whitespace-nowrap sm:px-3 sm:text-sm ${
              ativo ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
            }`}
          >
            {a.rotulo}
            {!!a.contador && <span className="rounded-full bg-red-600 px-1.5 text-xs leading-5 text-white">{a.contador}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
