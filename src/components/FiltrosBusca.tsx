// Barra de busca + ordenação + filtros (região, categoria, faixa de preço).
// É um formulário comum: ao aplicar, os filtros vão para o endereço da página
// (ex.: /busca?q=cimento&regiao=Gama), então dá para compartilhar o link.

import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { CATEGORIAS, REGIOES_EM_GRUPOS, rotuloRegiao } from "@/config/constantes";
import { SelectAutoEnvio } from "./SelectAutoEnvio";

export type ValoresFiltros = {
  q: string;
  regiao: string;
  categoria: string;
  min: string;
  max: string;
  ordem: string;
  marca: string;
};

const campo =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base focus:border-marca-500 focus:ring-2 focus:ring-marca-100 focus:outline-none";

export function FiltrosBusca({ valores, marcas = [] }: { valores: ValoresFiltros; marcas?: string[] }) {
  const ativos = [valores.regiao, valores.categoria, valores.min, valores.max, valores.marca].filter(Boolean).length;

  return (
    <form action="/busca" className="space-y-3">
      <div className="flex gap-2">
        <label htmlFor="q" className="sr-only">
          O que você procura?
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={valores.q}
          placeholder="Ex.: cimento CP II, areia média…"
          className={`${campo} min-w-0 flex-1`}
        />
        <button
          type="submit"
          className="flex items-center gap-2 rounded-lg bg-marca-600 px-4 font-semibold text-white hover:bg-marca-700"
          aria-label="Buscar"
        >
          <Search className="h-5 w-5" />
          <span className="hidden sm:inline">Buscar</span>
        </button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Ordenar:
          <SelectAutoEnvio
            name="ordem"
            defaultValue={valores.ordem}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm font-medium text-slate-900"
          >
            <option value="unidade">Menor preço por kg/m³/unidade</option>
            <option value="preco">Menor preço da embalagem</option>
          </SelectAutoEnvio>
        </label>
      </div>

      <details className="group rounded-xl border border-slate-200 bg-white" open={ativos > 0}>
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-semibold">
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {ativos > 0 && (
            <span className="rounded-full bg-marca-600 px-2 text-xs text-white">{ativos}</span>
          )}
          <span className="ml-auto text-sm font-normal text-slate-500 group-open:hidden">mostrar</span>
          <span className="ml-auto hidden text-sm font-normal text-slate-500 group-open:inline">
            esconder
          </span>
        </summary>

        <div className="grid gap-3 border-t border-slate-100 p-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            Região
            <select name="regiao" defaultValue={valores.regiao} className={`${campo} mt-1`}>
              <option value="">Todas as regiões (DF e Entorno)</option>
              {REGIOES_EM_GRUPOS.map(({ grupo, regioes }) => (
                <optgroup key={grupo.nome} label={grupo.nome}>
                  <option value={grupo.nome}>{grupo.todas}</option>
                  {regioes.map((r) => (
                    <option key={r} value={r}>
                      {rotuloRegiao(r)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium">
            Categoria
            <select name="categoria" defaultValue={valores.categoria} className={`${campo} mt-1`}>
              <option value="">Todas as categorias</option>
              {CATEGORIAS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>

          {(marcas.length > 0 || valores.marca) && (
            <label className="block text-sm font-medium sm:col-span-2">
              Marca
              <select name="marca" defaultValue={valores.marca} className={`${campo} mt-1`}>
                <option value="">Todas as marcas</option>
                {[...new Set([...marcas, valores.marca].filter(Boolean))].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </label>
          )}

          <fieldset className="sm:col-span-2">
            <legend className="text-sm font-medium">Preço da embalagem (R$)</legend>
            <div className="mt-1 flex items-center gap-2">
              <input name="min" inputMode="decimal" placeholder="mínimo" defaultValue={valores.min} className={campo} aria-label="Preço mínimo" />
              <span className="text-slate-400">até</span>
              <input name="max" inputMode="decimal" placeholder="máximo" defaultValue={valores.max} className={campo} aria-label="Preço máximo" />
            </div>
          </fieldset>

          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" className="flex-1 rounded-lg bg-slate-900 py-2.5 font-semibold text-white hover:bg-slate-800">
              Aplicar filtros
            </button>
            {ativos > 0 && (
              <Link
                href={`/busca?q=${encodeURIComponent(valores.q)}&ordem=${valores.ordem}`}
                className="rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
              >
                Limpar
              </Link>
            )}
          </div>
        </div>
      </details>
    </form>
  );
}
