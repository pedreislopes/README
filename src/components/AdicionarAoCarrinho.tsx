"use client";

// Escolha de quantidade (− / +) e botão "Adicionar" de cada oferta.
// Respeita o "passo" da oferta: 1 em 1 para sacos; 0,5 em 0,5 para m³ de areia.

import Link from "next/link";
import { useState, useTransition } from "react";
import { Check, Minus, Plus, ShoppingCart } from "lucide-react";
import { formatarQuantidade, lerQuantidade } from "@/domain/quantidades";
import { adicionarAoCarrinho } from "@/lib/acoes-carrinho";

type Props = { offerId: string; passo: number; embalagem: string };

export function AdicionarAoCarrinho({ offerId, passo, embalagem }: Props) {
  const [texto, setTexto] = useState(formatarQuantidade(passo));
  const [erro, setErro] = useState<string | null>(null);
  const [adicionado, setAdicionado] = useState(false);
  const [enviando, iniciar] = useTransition();

  const quantidade = lerQuantidade(texto) ?? 0;
  const mudar = (delta: number) => {
    const nova = Math.max(passo, Math.round((quantidade + delta) / passo) * passo);
    setTexto(formatarQuantidade(nova));
    setErro(null);
    setAdicionado(false);
  };

  const adicionar = () =>
    iniciar(async () => {
      const r = await adicionarAoCarrinho(offerId, quantidade);
      setErro(r.erro ?? null);
      setAdicionado(!!r.ok);
    });

  const botaoPasso = "grid h-10 w-10 place-items-center text-slate-600 hover:bg-slate-100 disabled:opacity-40";

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-lg border border-slate-300 bg-white">
          <button type="button" onClick={() => mudar(-passo)} disabled={quantidade <= passo} className={botaoPasso} aria-label="Diminuir">
            <Minus className="h-4 w-4" />
          </button>
          <input
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              setErro(null);
              setAdicionado(false);
            }}
            inputMode="decimal"
            aria-label={`Quantidade (${embalagem})`}
            className="h-10 w-14 border-x border-slate-200 text-center text-base font-semibold focus:outline-none"
          />
          <button type="button" onClick={() => mudar(passo)} className={botaoPasso} aria-label="Aumentar">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={adicionar}
          disabled={enviando}
          className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-marca-600 px-3 text-sm font-bold text-white hover:bg-marca-700 disabled:opacity-60"
        >
          <ShoppingCart className="h-4 w-4" />
          {enviando ? "Adicionando…" : "Adicionar"}
        </button>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        {passo < 1 ? `Vendido de ${formatarQuantidade(passo)} em ${formatarQuantidade(passo)} · ` : ""}
        {embalagem}
      </p>
      {erro && <p className="mt-1 text-sm font-medium text-red-600">{erro}</p>}
      {adicionado && (
        <p className="mt-1 flex items-center gap-1 text-sm font-medium text-emerald-700">
          <Check className="h-4 w-4" /> Adicionado.{" "}
          <Link href="/carrinho" className="underline">
            Ver carrinho
          </Link>
        </p>
      )}
    </div>
  );
}
