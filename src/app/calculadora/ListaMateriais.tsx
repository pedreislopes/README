"use client";

// Lista de materiais calculados: o cliente revisa, ajusta ou remove cada item
// e depois monta o carrinho com a oferta mais barata de cada um.

import { useState, useTransition } from "react";
import { AlertTriangle, Minus, Plus, ShoppingCart } from "lucide-react";
import type { Papel } from "@/config/constantes";
import { calcularItem, type OfertaPrecificavel } from "@/domain/precos";
import { formatarQuantidade, nomeDaEmbalagem } from "@/domain/quantidades";
import { montarCarrinhoDaCalculadora } from "@/lib/acoes-carrinho";
import { formatarReais } from "@/lib/dinheiro";

export type MaterialParaLista = {
  produtoId: string;
  nome: string;
  explicacao: string;
  fonte: string;
  conferir?: string;
  /** Ex.: "550 tijolos" */
  exatoTexto: string;
  escolha: {
    offerId: string;
    loja: string;
    regiao: string;
    packageLabel: string;
    passo: number;
    embalagens: number;
    embalagensExatas: number;
    oferta: OfertaPrecificavel;
  } | null;
};

export function ListaMateriais({ materiais, papel }: { materiais: MaterialParaLista[]; papel: Papel | null }) {
  const [estado, setEstado] = useState(() =>
    Object.fromEntries(materiais.map((m) => [m.produtoId, { incluir: !!m.escolha, embalagens: m.escolha?.embalagens ?? 0 }])),
  );
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();

  const mudar = (id: string, parcial: Partial<{ incluir: boolean; embalagens: number }>) =>
    setEstado((e) => ({ ...e, [id]: { ...e[id], ...parcial } }));

  const totalDe = (m: MaterialParaLista) =>
    m.escolha ? calcularItem(m.escolha.oferta, papel, estado[m.produtoId].embalagens, 1).totalCents : 0;
  const incluidos = materiais.filter((m) => m.escolha && estado[m.produtoId].incluir);
  const total = incluidos.reduce((s, m) => s + totalDe(m), 0);
  const lojas = new Set(incluidos.map((m) => m.escolha!.loja));

  const montar = () =>
    iniciar(async () => {
      const r = await montarCarrinhoDaCalculadora(
        incluidos.map((m) => ({ offerId: m.escolha!.offerId, quantidade: estado[m.produtoId].embalagens })),
      );
      if (r?.erro) setErro(r.erro);
    });

  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {materiais.map((m) => {
          const e = estado[m.produtoId];
          const esc = m.escolha;
          return (
            <li
              key={m.produtoId}
              className={`rounded-xl border bg-white p-4 ${esc && !e.incluir ? "border-slate-200 opacity-60" : "border-slate-200"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <label className="flex items-start gap-3">
                  {esc && (
                    <input
                      type="checkbox"
                      checked={e.incluir}
                      onChange={(ev) => mudar(m.produtoId, { incluir: ev.target.checked })}
                      className="mt-1 h-5 w-5 accent-marca-600"
                      aria-label={`Incluir ${m.nome}`}
                    />
                  )}
                  <span>
                    <span className="block font-bold">{m.nome}</span>
                    <span className="block text-sm text-slate-600">{m.explicacao}</span>
                  </span>
                </label>
                {esc && e.incluir && <span className="shrink-0 text-lg font-extrabold">{formatarReais(totalDe(m))}</span>}
              </div>

              {esc ? (
                e.incluir && (
                  <div className="mt-3 space-y-1 pl-8">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center rounded-lg border border-slate-300">
                        <button
                          type="button"
                          aria-label="Diminuir"
                          disabled={e.embalagens <= esc.passo}
                          onClick={() => mudar(m.produtoId, { embalagens: Math.max(esc.passo, e.embalagens - esc.passo) })}
                          className="grid h-10 w-10 place-items-center disabled:opacity-40"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-16 text-center font-semibold">{formatarQuantidade(e.embalagens)}</span>
                        <button
                          type="button"
                          aria-label="Aumentar"
                          onClick={() => mudar(m.produtoId, { embalagens: e.embalagens + esc.passo })}
                          className="grid h-10 w-10 place-items-center"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <span className="text-sm">
                        {nomeDaEmbalagem(esc.packageLabel, e.embalagens)}
                        {esc.packageLabel.includes(" ") ? ` (${esc.packageLabel})` : ""}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Calculado: {formatarQuantidade(Math.round(esc.embalagensExatas * 100) / 100)}{" "}
                      {nomeDaEmbalagem(esc.packageLabel, esc.embalagensExatas)}
                      {esc.packageLabel.includes(" ") || esc.packageLabel === "Milheiro" ? ` = ${m.exatoTexto}` : ""} · arredondado
                      para cima
                    </p>
                    <p className="text-sm text-slate-700">
                      Menor preço: <strong>{esc.loja}</strong> · {esc.regiao}
                    </p>
                  </div>
                )
              ) : (
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Nenhuma loja tem <strong>{m.nome}</strong> à venda no momento. Você vai precisar de{" "}
                    <strong>{m.exatoTexto}</strong>: compre em outro lugar ou tente mais tarde.
                  </span>
                </p>
              )}

              <details className="mt-2 pl-8 text-xs text-slate-500">
                <summary className="cursor-pointer">De onde vem este número?</summary>
                <p className="mt-1">{m.fonte}</p>
                {m.conferir && <p className="mt-1">Referência para conferir: {m.conferir}</p>}
              </details>
            </li>
          );
        })}
      </ul>

      <div className="sticky bottom-20 space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg md:bottom-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-slate-600">
            {incluidos.length} {incluidos.length === 1 ? "material" : "materiais"} em {lojas.size}{" "}
            {lojas.size === 1 ? "loja" : "lojas"}
          </span>
          <span className="text-xl font-extrabold">{formatarReais(total)}</span>
        </div>
        {erro && <p className="text-sm font-medium text-red-600">{erro}</p>}
        <button
          type="button"
          onClick={montar}
          disabled={enviando || incluidos.length === 0}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-marca-600 py-3.5 font-bold text-white hover:bg-marca-700 disabled:opacity-50"
        >
          <ShoppingCart className="h-5 w-5" />
          {enviando ? "Montando carrinho…" : "Montar carrinho com menor preço"}
        </button>
        <p className="text-center text-xs text-slate-500">Frete a combinar com cada loja.</p>
      </div>
    </div>
  );
}
