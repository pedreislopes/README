"use client";

// Modelos (itens do catálogo de marca) de um tipo de produto, com a caixa
// "Comparar". O cliente marca de 2 a 3 e vê a tabela lado a lado em /comparar.

import { useState } from "react";
import { Columns3 } from "lucide-react";
import { COMPARAR_MAX, COMPARAR_MIN } from "@/config/caracteristicas";
import { FotoProduto } from "./FotoProduto";

export type ModeloParaLista = {
  id: string;
  marca: string;
  modelo: string;
  fotoId: string | null;
  /** Ex.: ["450 g", "Madeira"] — características principais, já formatadas */
  destaques: string[];
  /** Ex.: "R$ 39,90" e "em 3 lojas" (ou null se nenhuma loja vende agora) */
  aPartirDe: string | null;
  lojas: number;
  /** Tinta: "R$ 0,95 por m² pintado" */
  extra?: string;
};

export function ListaModelos({ modelos, categoria }: { modelos: ModeloParaLista[]; categoria: string }) {
  const [marcados, setMarcados] = useState<string[]>([]);
  const alternar = (id: string) =>
    setMarcados((m) => (m.includes(id) ? m.filter((x) => x !== id) : m.length < COMPARAR_MAX ? [...m, id] : m));

  return (
    <form action="/comparar" className="space-y-2">
      <ul className="space-y-2">
        {modelos.map((m) => {
          const marcado = marcados.includes(m.id);
          const cheio = !marcado && marcados.length >= COMPARAR_MAX;
          return (
            <li key={m.id} className={`flex gap-3 rounded-xl border bg-white p-3 ${marcado ? "border-marca-400 ring-1 ring-marca-400" : "border-slate-200"}`}>
              <FotoProduto fotoId={m.fotoId} categoria={categoria} descricao={`${m.marca} ${m.modelo}`} tamanho={80} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900">{m.marca}</p>
                <p className="text-sm text-slate-700">{m.modelo}</p>
                {m.destaques.length > 0 && <p className="mt-0.5 text-xs text-slate-500">{m.destaques.join(" · ")}</p>}
                <p className="mt-1 text-sm">
                  {m.aPartirDe ? (
                    <>
                      a partir de <strong>{m.aPartirDe}</strong> <span className="text-slate-500">em {m.lojas} {m.lojas === 1 ? "loja" : "lojas"}</span>
                    </>
                  ) : (
                    <span className="text-slate-500">Nenhuma loja vende agora</span>
                  )}
                </p>
                {m.extra && <p className="text-xs font-semibold text-emerald-800">{m.extra}</p>}
                <label className={`mt-2 inline-flex items-center gap-2 text-sm font-medium ${cheio ? "text-slate-400" : "text-slate-800"}`}>
                  <input
                    type="checkbox"
                    name="item"
                    value={m.id}
                    checked={marcado}
                    disabled={cheio}
                    onChange={() => alternar(m.id)}
                    className="h-5 w-5 accent-marca-600"
                  />
                  Comparar
                </label>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="sticky bottom-20 z-10 md:bottom-4">
        <button
          type="submit"
          disabled={marcados.length < COMPARAR_MIN}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 font-bold text-white shadow-lg disabled:bg-slate-300 disabled:text-slate-600 disabled:shadow-none"
        >
          <Columns3 className="h-5 w-5" />
          {marcados.length < COMPARAR_MIN
            ? `Marque de ${COMPARAR_MIN} a ${COMPARAR_MAX} para comparar`
            : `Comparar ${marcados.length} produtos lado a lado`}
        </button>
      </div>
    </form>
  );
}
