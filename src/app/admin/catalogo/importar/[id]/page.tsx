// Prévia (ou resultado) de uma importação do catálogo de marca.
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { textoResumoCatalogo, type LinhaCatalogo, type ResumoCatalogo } from "@/domain/importacao-catalogo";
import { exigirAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { SITUACAO_IMPORTACAO } from "@/app/loja/importar/situacao";
import { BotoesCatalogo } from "./BotoesCatalogo";

export const metadata = { title: "Importação do catálogo" };

const GRUPOS: { tipo: LinhaCatalogo["tipo"]; titulo: string; cor: string }[] = [
  { tipo: "ERRO", titulo: "Linhas com erro (NÃO serão gravadas)", cor: "border-red-200 bg-red-50" },
  { tipo: "NOVO", titulo: "Produtos novos", cor: "border-emerald-200 bg-white" },
  { tipo: "ALTERADO", titulo: "Produtos atualizados", cor: "border-slate-200 bg-white" },
];

export default async function ImportacaoCatalogo(props: PageProps<"/admin/catalogo/importar/[id]">) {
  await exigirAdmin();
  const { id } = await props.params;
  const importacao = await db.catalogImport.findUnique({ where: { id } });
  if (!importacao) notFound();
  const linhas = JSON.parse(importacao.rows) as LinhaCatalogo[];
  const resumo = JSON.parse(importacao.summary) as ResumoCatalogo;
  const situacao = SITUACAO_IMPORTACAO[importacao.status];

  return (
    <div className="space-y-4">
      <Link href="/admin/catalogo/importar" className="inline-flex items-center gap-1 text-sm text-slate-600">
        <ChevronLeft className="h-4 w-4" /> Importar catálogo
      </Link>
      <header>
        <p className="text-sm break-all text-slate-500">{importacao.fileName}</p>
        <h2 className="text-lg font-bold">{importacao.status === "PREVIA" ? "Confira antes de salvar" : "Importação do catálogo"}</h2>
        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${situacao?.cor}`}>{situacao?.rotulo}</span>
      </header>
      <p role="status" className="rounded-xl border border-slate-200 bg-white p-4 font-semibold">
        {textoResumoCatalogo(resumo)}
      </p>
      {importacao.status === "PREVIA" && <BotoesCatalogo id={importacao.id} alteracoes={resumo.novos + resumo.alterados} />}
      {GRUPOS.map((g) => {
        const doGrupo = linhas.filter((l) => l.tipo === g.tipo);
        if (doGrupo.length === 0) return null;
        return (
          <section key={g.tipo} className="space-y-2">
            <h3 className="font-bold">
              {g.titulo} ({doGrupo.length})
            </h3>
            <ul className="space-y-2">
              {doGrupo.map((l) => (
                <li key={l.linha} className={`rounded-xl border p-3 text-sm ${g.cor}`}>
                  <p className="font-semibold">
                    <span className="mr-1 rounded bg-slate-200 px-1.5 py-0.5 text-xs font-bold text-slate-700">Linha {l.linha}</span>
                    {l.descricao}
                  </p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5">
                    {(g.tipo === "ERRO" ? l.erros : l.mudancas).map((m) => (
                      <li key={m} className={g.tipo === "ERRO" ? "text-red-800" : "text-slate-700"}>
                        {m}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
