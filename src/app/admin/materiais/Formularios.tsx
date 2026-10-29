"use client";

import { useActionState, useState, useTransition } from "react";
import { Alerta, estiloCampo } from "@/components/Formulario";
import Link from "next/link";
import { MODELOS_CARACTERISTICAS } from "@/config/caracteristicas";
import { CATEGORIAS, UNIDADES_BASE } from "@/config/constantes";
import { aprovarSugestao, criarMaterial, recusarSugestao } from "@/lib/acoes-admin";

/** Campos comuns: nome, categoria, unidade de comparação e palavras para a busca */
function CamposMaterial({ v }: { v: (campo: string, padrao?: string) => string }) {
  return (
    <>
      <input name="nome" defaultValue={v("nome")} placeholder="Nome do material" aria-label="Nome do material" className={estiloCampo} />
      <div className="grid grid-cols-2 gap-2">
        <select name="categoria" defaultValue={v("categoria")} aria-label="Categoria" className={estiloCampo}>
          <option value="">Categoria…</option>
          {CATEGORIAS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select name="unidade" defaultValue={v("unidade")} aria-label="Unidade de comparação" className={estiloCampo}>
          <option value="">Comparar por…</option>
          {Object.entries(UNIDADES_BASE).map(([u, rot]) => (
            <option key={u} value={u}>
              {rot}
            </option>
          ))}
        </select>
      </div>
      <input
        name="palavras"
        defaultValue={v("palavras")}
        placeholder="Palavras para a busca (opcional, ex.: bloco estrutural 19)"
        aria-label="Palavras para a busca"
        className={estiloCampo}
      />
      <label className="block text-sm text-slate-700">
        <span className="font-semibold">Tipo de material</span>
        <select name="caracteristicas" defaultValue={v("caracteristicas")} aria-label="Tipo de material" className={estiloCampo}>
          <option value="">Padronizado (cimento, areia…): compara só o preço</option>
          {Object.entries(MODELOS_CARACTERISTICAS).map(([chave, m]) => (
            <option key={chave} value={chave}>
              Produto de marca — características de {m.nome.toLowerCase()}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-slate-500">
          Produto de marca: as lojas escolhem os produtos do catálogo de marca (aba Marcas).
        </span>
      </label>
    </>
  );
}

export function FormularioMaterial() {
  const [estado, acao, enviando] = useActionState(criarMaterial, {});
  const v = (campo: string) => estado.enviado?.[campo] ?? "";
  return (
    <form key={estado.resposta ?? 0} action={acao} className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
      {estado.erro && <Alerta>{estado.erro}</Alerta>}
      {estado.ok && <p className="rounded-lg bg-emerald-50 p-2 text-sm font-semibold text-emerald-800">{estado.ok}</p>}
      <CamposMaterial v={v} />
      <button type="submit" disabled={enviando} className="w-full rounded-lg bg-slate-900 py-3 font-bold text-white disabled:opacity-60">
        {enviando ? "Incluindo…" : "Incluir no catálogo"}
      </button>
    </form>
  );
}

type Sugestao = { id: string; nome: string; categoria: string; unidade: string; observacao: string | null; loja: string };

export function RevisarSugestao({ sugestao: s }: { sugestao: Sugestao }) {
  const [enviando, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [recusando, setRecusando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const padrao: Record<string, string> = { nome: s.nome, categoria: s.categoria, unidade: s.unidade };

  return (
    <div className="space-y-2 rounded-2xl border border-amber-300 bg-white p-4">
      <p className="text-sm text-slate-600">
        Sugerido por <strong>{s.loja}</strong>
        {s.observacao ? ` — “${s.observacao}”` : ""}
      </p>
      <form
        // onSubmit (em vez de action) para o formulário não ser apagado se houver erro
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          iniciar(async () => {
            const r = await aprovarSugestao(s.id, form);
            setErro(r.erro ?? null);
          });
        }}
        className="space-y-2"
      >
        <p className="text-xs text-slate-500">Revise e corrija os dados antes de aprovar:</p>
        <CamposMaterial v={(campo) => padrao[campo] ?? ""} />
        {!recusando && (
          <div className="flex gap-2">
            <button type="submit" disabled={enviando} className="flex-1 rounded-lg bg-emerald-600 py-2.5 font-bold text-white disabled:opacity-60">
              Aprovar e incluir
            </button>
            <button type="button" onClick={() => setRecusando(true)} className="flex-1 rounded-lg border border-slate-300 py-2.5 font-semibold">
              Recusar
            </button>
          </div>
        )}
      </form>
      {recusando && (
        <div className="space-y-2">
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={2}
            placeholder="Motivo (o lojista verá este texto)"
            aria-label="Motivo da recusa"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base"
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => setRecusando(false)} className="flex-1 rounded-lg border border-slate-300 py-2.5 font-semibold">
              Voltar
            </button>
            <button
              type="button"
              disabled={enviando}
              onClick={() =>
                iniciar(async () => {
                  const r = await recusarSugestao(s.id, motivo);
                  setErro(r.erro ?? null);
                })
              }
              className="flex-1 rounded-lg bg-red-700 py-2.5 font-bold text-white disabled:opacity-60"
            >
              Confirmar recusa
            </button>
          </div>
        </div>
      )}
      {erro && <p className="text-sm font-medium text-red-600">{erro}</p>}
    </div>
  );
}

/** Sugestão de PRODUTO DE MARCA: o administrador completa no catálogo de marca e aprova */
export function SugestaoDeMarca({
  sugestao: s,
}: {
  sugestao: { id: string; nome: string; ean: string | null; observacao: string | null; loja: string; tipo: string };
}) {
  const [enviando, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [recusando, setRecusando] = useState(false);
  const [motivo, setMotivo] = useState("");
  return (
    <div className="space-y-2 rounded-2xl border border-violet-300 bg-white p-4">
      <p className="text-xs font-semibold text-violet-800 uppercase">Produto de marca</p>
      <p className="font-bold">{s.nome}</p>
      <p className="text-sm text-slate-600">
        {s.tipo} · código de barras {s.ean ?? "—"} · sugerido por <strong>{s.loja}</strong>
        {s.observacao ? ` — “${s.observacao}”` : ""}
      </p>
      {recusando ? (
        <div className="space-y-2">
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={2}
            placeholder="Motivo (o lojista verá este texto)"
            aria-label="Motivo da recusa"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base"
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => setRecusando(false)} className="flex-1 rounded-lg border border-slate-300 py-2.5 font-semibold">
              Voltar
            </button>
            <button
              type="button"
              disabled={enviando}
              onClick={() => iniciar(async () => setErro((await recusarSugestao(s.id, motivo)).erro ?? null))}
              className="flex-1 rounded-lg bg-red-700 py-2.5 font-bold text-white disabled:opacity-60"
            >
              Confirmar recusa
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Link href={`/admin/catalogo/novo?sugestao=${s.id}`} className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-center font-bold text-white">
            Completar e aprovar
          </Link>
          <button type="button" onClick={() => setRecusando(true)} className="flex-1 rounded-lg border border-slate-300 py-2.5 font-semibold">
            Recusar
          </button>
        </div>
      )}
      {erro && <p className="text-sm font-medium text-red-600">{erro}</p>}
    </div>
  );
}
