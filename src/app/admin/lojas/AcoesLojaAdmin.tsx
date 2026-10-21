"use client";

import { useState, useTransition } from "react";
import { aprovarLoja, alterarComissao, alterarPlano, reativarLoja, recusarLoja, suspenderLoja, type Resultado } from "@/lib/acoes-admin";

type Loja = { id: string; nome: string; status: string; comissao: number; plano: string };

export function AcoesLojaAdmin({ loja, planos }: { loja: Loja; planos: Record<string, string> }) {
  const [enviando, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pedindoMotivo, setPedindoMotivo] = useState<"recusar" | "suspender" | null>(null);
  const [motivo, setMotivo] = useState("");
  const [comissao, setComissao] = useState(loja.comissao.toLocaleString("pt-BR"));
  const [plano, setPlano] = useState(loja.plano);

  const executar = (acao: () => Promise<Resultado>, sucesso: string) =>
    iniciar(async () => {
      const r = await acao();
      setErro(r.erro ?? null);
      setOk(r.ok ? sucesso : null);
      if (r.ok) {
        setPedindoMotivo(null);
        setMotivo("");
      }
    });

  const botao = "rounded-lg px-4 py-2.5 text-sm font-bold disabled:opacity-50";
  const comissaoMudou = comissao !== loja.comissao.toLocaleString("pt-BR");

  return (
    <div className="space-y-3 border-t border-slate-100 pt-3">
      {/* Situação */}
      <div className="flex flex-wrap gap-2">
        {(loja.status === "PENDENTE" || loja.status === "RECUSADA") && (
          <button type="button" disabled={enviando} onClick={() => executar(() => aprovarLoja(loja.id), "Loja aprovada.")} className={`${botao} bg-emerald-600 text-white`}>
            Aprovar
          </button>
        )}
        {loja.status === "PENDENTE" && (
          <button type="button" disabled={enviando} onClick={() => setPedindoMotivo("recusar")} className={`${botao} border border-slate-300`}>
            Recusar
          </button>
        )}
        {loja.status === "APROVADA" && (
          <button type="button" disabled={enviando} onClick={() => setPedindoMotivo("suspender")} className={`${botao} border border-red-300 text-red-700`}>
            Suspender
          </button>
        )}
        {loja.status === "SUSPENSA" && (
          <button type="button" disabled={enviando} onClick={() => executar(() => reativarLoja(loja.id), "Loja reativada.")} className={`${botao} bg-emerald-600 text-white`}>
            Reativar
          </button>
        )}
      </div>

      {pedindoMotivo && (
        <div className="space-y-2 rounded-xl bg-slate-50 p-3">
          <label htmlFor={`motivo-${loja.id}`} className="block text-sm font-semibold">
            Motivo da {pedindoMotivo === "recusar" ? "recusa" : "suspensão"} (o lojista verá este texto)
          </label>
          <textarea
            id={`motivo-${loja.id}`}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={2}
            maxLength={300}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base"
          />
          {pedindoMotivo === "suspender" && (
            <p className="text-xs text-slate-500">A loja some da busca, mas produtos, pedidos e histórico continuam guardados.</p>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={() => setPedindoMotivo(null)} className={`${botao} flex-1 border border-slate-300 bg-white`}>
              Voltar
            </button>
            <button
              type="button"
              disabled={enviando}
              onClick={() =>
                pedindoMotivo === "recusar"
                  ? executar(() => recusarLoja(loja.id, motivo), "Loja recusada.")
                  : executar(() => suspenderLoja(loja.id, motivo), "Loja suspensa.")
              }
              className={`${botao} flex-1 bg-red-700 text-white`}
            >
              Confirmar {pedindoMotivo === "recusar" ? "recusa" : "suspensão"}
            </button>
          </div>
        </div>
      )}

      {/* Comissão e destaque */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm font-semibold">
          Comissão
          <span className="flex items-center rounded-lg border border-slate-300 bg-white pr-2">
            <input
              value={comissao}
              onChange={(e) => {
                setComissao(e.target.value);
                setOk(null);
              }}
              inputMode="decimal"
              aria-label={`Comissão de ${loja.nome}`}
              className="w-16 px-2 py-2 text-right text-base focus:outline-none"
            />
            %
          </span>
        </label>
        {comissaoMudou && (
          <button
            type="button"
            disabled={enviando}
            onClick={() => executar(() => alterarComissao(loja.id, comissao), "Comissão alterada. Vale para pedidos novos.")}
            className={`${botao} bg-slate-900 text-white`}
          >
            Salvar comissão
          </button>
        )}
      </div>
      {comissaoMudou && <p className="text-xs text-slate-500">A nova comissão vale só para pedidos feitos depois da mudança.</p>}

      {/* Plano de anúncio no topo da busca */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm font-semibold">
          Plano de anúncio
          <select
            value={plano}
            onChange={(e) => {
              setPlano(e.target.value);
              setOk(null);
            }}
            aria-label={`Plano de anúncio de ${loja.nome}`}
            className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-base"
          >
            {Object.entries(planos).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </label>
        {plano !== loja.plano && (
          <button
            type="button"
            disabled={enviando}
            onClick={() => executar(() => alterarPlano(loja.id, plano), `Plano alterado para ${planos[plano]}.`)}
            className={`${botao} bg-slate-900 text-white`}
          >
            Salvar plano
          </button>
        )}
      </div>

      {erro && <p className="text-sm font-medium text-red-600">{erro}</p>}
      {ok && <p className="text-sm font-medium text-emerald-700">{ok}</p>}
    </div>
  );
}
