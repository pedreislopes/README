"use client";

// Controles de um item do carrinho: mudar quantidade, remover e
// "completar até a próxima faixa" (incentivo de atacado).

import { useState, useTransition } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { formatarQuantidade, lerQuantidade } from "@/domain/quantidades";
import { alterarQuantidade, removerItem } from "@/lib/acoes-carrinho";

type Props = { itemId: string; quantidade: number; passo: number; embalagem: string };

export function ControlesItem({ itemId, quantidade, passo, embalagem }: Props) {
  const [texto, setTexto] = useState(formatarQuantidade(quantidade));
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();

  const salvar = (nova: number) =>
    iniciar(async () => {
      setTexto(formatarQuantidade(nova));
      const r = await alterarQuantidade(itemId, nova);
      setErro(r.erro ?? null);
      if (r.erro) setTexto(formatarQuantidade(quantidade));
    });

  const botao = "grid h-10 w-10 place-items-center text-slate-600 hover:bg-slate-100 disabled:opacity-40";

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className={`flex items-center rounded-lg border border-slate-300 bg-white ${enviando ? "opacity-60" : ""}`}>
          <button type="button" className={botao} disabled={enviando || quantidade <= passo} onClick={() => salvar(quantidade - passo)} aria-label="Diminuir">
            <Minus className="h-4 w-4" />
          </button>
          <input
            value={texto}
            inputMode="decimal"
            aria-label={`Quantidade (${embalagem})`}
            onChange={(e) => setTexto(e.target.value)}
            onBlur={() => {
              const nova = lerQuantidade(texto);
              if (nova !== null && nova !== quantidade) salvar(nova);
              else setTexto(formatarQuantidade(quantidade));
            }}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            className="h-10 w-16 border-x border-slate-200 text-center text-base font-semibold focus:outline-none"
          />
          <button type="button" className={botao} disabled={enviando} onClick={() => salvar(quantidade + passo)} aria-label="Aumentar">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          disabled={enviando}
          onClick={() => iniciar(async () => void (await removerItem(itemId)))}
          className="grid h-10 w-10 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
          aria-label="Remover do carrinho"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
      {erro && <p className="mt-1 text-sm font-medium text-red-600">{erro}</p>}
    </div>
  );
}

/** Botão do incentivo: leva a quantidade direto até a próxima faixa */
export function CompletarFaixa({ itemId, ate, texto }: { itemId: string; ate: number; texto: string }) {
  const [enviando, iniciar] = useTransition();
  return (
    <button
      type="button"
      disabled={enviando}
      onClick={() => iniciar(async () => void (await alterarQuantidade(itemId, ate)))}
      className="mt-2 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-60"
    >
      {enviando ? "Atualizando…" : texto}
    </button>
  );
}
