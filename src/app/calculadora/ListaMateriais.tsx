"use client";

// Lista de materiais calculados, com dois planos de compra lado a lado:
//   • Menor preço por item (cada material na loja mais barata para ele)
//   • Tudo numa loja só (menos fretes)
// O cliente escolhe o plano, revisa/ajusta/remove itens e monta o carrinho.

import { useState, useTransition } from "react";
import { AlertTriangle, Check, Minus, Plus, ShoppingCart, Store, Tags } from "lucide-react";
import { AjudaMaterial } from "@/components/AjudaMaterial";
import type { Explicacao } from "@/config/explicacoes-materiais";
import type { Papel } from "@/config/constantes";
import { calcularItem, type OfertaPrecificavel } from "@/domain/precos";
import { formatarQuantidade, nomeDaEmbalagem } from "@/domain/quantidades";
import { montarCarrinhoDaCalculadora } from "@/lib/acoes-carrinho";
import { formatarReais } from "@/lib/dinheiro";

export type EscolhaParaLista = {
  offerId: string;
  loja: string;
  regiao: string;
  packageLabel: string;
  passo: number;
  embalagens: number;
  embalagensExatas: number;
  oferta: OfertaPrecificavel;
};

export type MaterialParaLista = {
  produtoId: string;
  nome: string;
  explicacao: string;
  fonte: string;
  conferir?: string;
  /** Explicação do material (ícone "?"), quando houver */
  ajuda?: Pick<Explicacao, "oQueE" | "paraQue" | "quandoUsar">;
  /** Ex.: "550 tijolos" */
  exatoTexto: string;
  porItem: EscolhaParaLista | null;
  lojaUnica: EscolhaParaLista | null;
};

type Plano = "porItem" | "lojaUnica";

type Props = {
  materiais: MaterialParaLista[];
  papel: Papel | null;
  lojaUnica: { name: string; region: string } | null;
};

export function ListaMateriais({ materiais, papel, lojaUnica }: Props) {
  const [plano, setPlano] = useState<Plano>("porItem");
  const [incluir, setIncluir] = useState(() => Object.fromEntries(materiais.map((m) => [m.produtoId, true])));
  // Quantidade escolhida em cada plano (as embalagens podem ser diferentes)
  const [qtd, setQtd] = useState(() =>
    Object.fromEntries(
      materiais.flatMap((m) => [
        [`porItem:${m.produtoId}`, m.porItem?.embalagens ?? 0],
        [`lojaUnica:${m.produtoId}`, m.lojaUnica?.embalagens ?? 0],
      ]),
    ),
  );
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();

  const escolhaDe = (m: MaterialParaLista, p: Plano) => m[p];
  const quantidadeDe = (m: MaterialParaLista, p: Plano) => qtd[`${p}:${m.produtoId}`];
  const totalDe = (m: MaterialParaLista, p: Plano) => {
    const e = escolhaDe(m, p);
    return e ? calcularItem(e.oferta, papel, quantidadeDe(m, p), 1).totalCents : 0;
  };
  const resumo = (p: Plano) => {
    const itens = materiais.filter((m) => incluir[m.produtoId] && escolhaDe(m, p));
    return {
      itens,
      total: itens.reduce((s, m) => s + totalDe(m, p), 0),
      lojas: new Set(itens.map((m) => escolhaDe(m, p)!.loja)).size,
      faltam: materiais.filter((m) => incluir[m.produtoId] && !escolhaDe(m, p) && m.porItem),
    };
  };
  const porItem = resumo("porItem");
  const unica = resumo("lojaUnica");
  const atual = plano === "porItem" ? porItem : unica;

  const montar = () =>
    iniciar(async () => {
      const r = await montarCarrinhoDaCalculadora(
        atual.itens.map((m) => ({ offerId: escolhaDe(m, plano)!.offerId, quantidade: quantidadeDe(m, plano) })),
      );
      if (r?.erro) setErro(r.erro);
    });

  const fretes = (n: number) => `${n} ${n === 1 ? "frete" : "fretes"} a combinar`;

  return (
    <div className="space-y-3">
      {/* Os dois planos lado a lado */}
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Como comprar">
        <CartaoPlano
          ativo={plano === "porItem"}
          onClick={() => setPlano("porItem")}
          Icone={Tags}
          titulo="Menor preço por item"
          total={porItem.total}
          detalhe={`em ${porItem.lojas} ${porItem.lojas === 1 ? "loja" : "lojas"} (${fretes(porItem.lojas)})`}
        />
        {lojaUnica ? (
          <CartaoPlano
            ativo={plano === "lojaUnica"}
            onClick={() => setPlano("lojaUnica")}
            Icone={Store}
            titulo={`Tudo na ${lojaUnica.name}`}
            total={unica.total}
            detalhe={`em 1 loja (1 frete) · ${lojaUnica.region}`}
            alerta={unica.faltam.length > 0 ? `Não tem: ${unica.faltam.map((m) => m.nome).join(", ")}` : undefined}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 p-3 text-sm text-slate-500">
            Nenhuma loja vende estes itens.
          </div>
        )}
      </div>
      {plano === "lojaUnica" && unica.total > porItem.total && (
        <p className="text-sm text-slate-600">
          Comprar tudo numa loja custa {formatarReais(unica.total - porItem.total)} a mais, mas você combina um frete
          só.
        </p>
      )}

      <ul className="space-y-3">
        {materiais.map((m) => {
          const esc = escolhaDe(m, plano);
          const chave = `${plano}:${m.produtoId}`;
          const n = qtd[chave];
          const incluido = incluir[m.produtoId];
          return (
            <li key={m.produtoId} className={`rounded-xl border border-slate-200 bg-white p-4 ${esc && !incluido ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  {esc && (
                    <input
                      type="checkbox"
                      checked={incluido}
                      onChange={(ev) => setIncluir((i) => ({ ...i, [m.produtoId]: ev.target.checked }))}
                      className="mt-1 h-5 w-5 shrink-0 accent-marca-600"
                      aria-label={`Incluir ${m.nome}`}
                    />
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-1">
                      <span className="font-bold">{m.nome}</span>
                      {m.ajuda && <AjudaMaterial nome={m.nome} explicacao={m.ajuda} />}
                    </div>
                    <span className="block text-sm text-slate-600">{m.explicacao}</span>
                  </div>
                </div>
                {esc && incluido && <span className="shrink-0 text-lg font-extrabold">{formatarReais(totalDe(m, plano))}</span>}
              </div>

              {esc ? (
                incluido && (
                  <div className="mt-3 space-y-1 pl-8">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center rounded-lg border border-slate-300">
                        <button
                          type="button"
                          aria-label="Diminuir"
                          disabled={n <= esc.passo}
                          onClick={() => setQtd((q) => ({ ...q, [chave]: Math.max(esc.passo, n - esc.passo) }))}
                          className="grid h-10 w-10 place-items-center disabled:opacity-40"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-16 text-center font-semibold">{formatarQuantidade(n)}</span>
                        <button
                          type="button"
                          aria-label="Aumentar"
                          onClick={() => setQtd((q) => ({ ...q, [chave]: n + esc.passo }))}
                          className="grid h-10 w-10 place-items-center"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <span className="text-sm">
                        {nomeDaEmbalagem(esc.packageLabel, n)}
                        {esc.packageLabel.includes(" ") ? ` (${esc.packageLabel})` : ""}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Calculado: {formatarQuantidade(Math.round(esc.embalagensExatas * 100) / 100)}{" "}
                      {nomeDaEmbalagem(esc.packageLabel, esc.embalagensExatas)}
                      {esc.packageLabel.includes(" ") || esc.packageLabel === "Milheiro" ? ` = ${m.exatoTexto}` : ""} ·
                      arredondado para cima
                    </p>
                    <p className="text-sm text-slate-700">
                      {plano === "porItem" ? "Menor preço: " : "Loja: "}
                      <strong>{esc.loja}</strong> · {esc.regiao}
                    </p>
                  </div>
                )
              ) : (
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {plano === "lojaUnica" && m.porItem ? (
                      <>
                        A <strong>{lojaUnica?.name}</strong> não vende este item. Você vai precisar de{" "}
                        <strong>{m.exatoTexto}</strong>: escolha &quot;Menor preço por item&quot; ou compre à parte.
                      </>
                    ) : (
                      <>
                        Nenhuma loja tem <strong>{m.nome}</strong> à venda no momento. Você vai precisar de{" "}
                        <strong>{m.exatoTexto}</strong>: compre em outro lugar ou tente mais tarde.
                      </>
                    )}
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
            {atual.itens.length} {atual.itens.length === 1 ? "material" : "materiais"} · {fretes(atual.lojas)}
          </span>
          <span className="text-xl font-extrabold">{formatarReais(atual.total)}</span>
        </div>
        {erro && <p className="text-sm font-medium text-red-600">{erro}</p>}
        <button
          type="button"
          onClick={montar}
          disabled={enviando || atual.itens.length === 0}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-marca-600 py-3.5 font-bold text-white hover:bg-marca-700 disabled:opacity-50"
        >
          <ShoppingCart className="h-5 w-5" />
          {enviando ? "Montando carrinho…" : plano === "porItem" ? "Montar carrinho com menor preço" : "Montar carrinho numa loja só"}
        </button>
      </div>
    </div>
  );
}

function CartaoPlano({
  ativo,
  onClick,
  Icone,
  titulo,
  total,
  detalhe,
  alerta,
}: {
  ativo: boolean;
  onClick: () => void;
  Icone: typeof Store;
  titulo: string;
  total: number;
  detalhe: string;
  alerta?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={ativo}
      onClick={onClick}
      className={`relative rounded-xl border-2 p-3 text-left ${ativo ? "border-marca-500 bg-marca-50" : "border-slate-200 bg-white"}`}
    >
      {ativo && <Check className="absolute top-2 right-2 h-4 w-4 text-marca-600" />}
      <Icone className={`h-5 w-5 ${ativo ? "text-marca-600" : "text-slate-400"}`} />
      <span className="mt-1 block pr-4 text-sm leading-tight font-semibold">{titulo}</span>
      <span className="mt-1 block text-lg font-extrabold">{formatarReais(total)}</span>
      <span className="block text-xs text-slate-600">{detalhe}</span>
      {alerta && <span className="mt-1 block text-xs font-medium text-amber-700">{alerta}</span>}
    </button>
  );
}
