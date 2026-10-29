// Prévia (ou resultado) de uma importação: resumo e o que acontece em cada linha.
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertCircle, CheckCircle2, ChevronLeft } from "lucide-react";
import { textoDoResumo, VALIDADE_PREVIA_MS, type ResultadoLinha, type ResumoImportacao, type TipoLinha } from "@/domain/importacao";
import { db } from "@/lib/db";
import { exigirLoja } from "@/lib/loja";
import { SITUACAO_IMPORTACAO } from "../situacao";
import { BotoesImportacao } from "./BotoesImportacao";

export const metadata = { title: "Importação de planilha" };

const GRUPOS: { tipo: TipoLinha; titulo: string; cor: string }[] = [
  { tipo: "ERRO", titulo: "Linhas com erro (NÃO serão gravadas)", cor: "border-red-200 bg-red-50" },
  { tipo: "PRECO", titulo: "Preços alterados", cor: "border-marca-200 bg-white" },
  { tipo: "NOVO", titulo: "Produtos novos", cor: "border-emerald-200 bg-white" },
  { tipo: "OUTROS", titulo: "Outras alterações", cor: "border-slate-200 bg-white" },
];

/** A prévia vale 24 horas */
function previaVencida(criadaEm: Date) {
  return Date.now() - criadaEm.getTime() > VALIDADE_PREVIA_MS;
}

export default async function Importacao(props: PageProps<"/loja/importar/[id]">) {
  const { loja } = await exigirLoja();
  const { id } = await props.params;
  // storeId no filtro: uma loja nunca vê a importação de outra
  const importacao = await db.storeImport.findFirst({ where: { id, storeId: loja.id } });
  if (!importacao) notFound();

  const linhas = JSON.parse(importacao.rows) as ResultadoLinha[];
  const resumo = JSON.parse(importacao.summary) as ResumoImportacao;
  const situacao = SITUACAO_IMPORTACAO[importacao.status] ?? SITUACAO_IMPORTACAO.DESCARTADA;
  const previa = importacao.status === "PREVIA";
  const vencida = previa && previaVencida(importacao.createdAt);
  const alteracoes = resumo.precosAlterados + resumo.novos + resumo.outrosAlterados;

  const numeros = [
    { n: resumo.precosAlterados, rotulo: resumo.precosAlterados === 1 ? "preço alterado" : "preços alterados", cor: "text-marca-700" },
    { n: resumo.novos, rotulo: resumo.novos === 1 ? "produto novo" : "produtos novos", cor: "text-emerald-700" },
    { n: resumo.outrosAlterados, rotulo: "outras alterações", cor: "text-slate-700" },
    { n: resumo.erros, rotulo: resumo.erros === 1 ? "erro" : "erros", cor: "text-red-700" },
  ];

  return (
    <div className="space-y-5">
      <Link href="/loja/importar" className="inline-flex items-center gap-1 text-sm text-slate-600">
        <ChevronLeft className="h-4 w-4" /> Importar planilha
      </Link>
      <header>
        <p className="text-sm break-all text-slate-500">{importacao.fileName}</p>
        <h1 className="text-xl font-extrabold">{previa ? "Confira antes de salvar" : "Importação"}</h1>
        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${situacao.cor}`}>{situacao.rotulo}</span>
      </header>

      <section aria-label="Resumo" className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="sr-only">{textoDoResumo(resumo)}</p>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {numeros.map((x) => (
            <div key={x.rotulo} className="rounded-xl bg-slate-50 p-3 text-center">
              <dd className={`text-2xl font-extrabold ${x.cor}`}>{x.n}</dd>
              <dt className="text-xs text-slate-600">{x.rotulo}</dt>
            </div>
          ))}
        </dl>
        {resumo.semMudanca > 0 && (
          <p className="mt-3 text-center text-xs text-slate-500">
            {resumo.semMudanca} {resumo.semMudanca === 1 ? "linha igual" : "linhas iguais"} ao que já está cadastrado.
          </p>
        )}
      </section>

      {importacao.status === "APLICADA" && (
        <p role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 font-semibold text-emerald-800">
          <CheckCircle2 className="h-5 w-5 shrink-0" /> Importação aplicada em{" "}
          {importacao.appliedAt?.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" })}.
          <Link href="/loja/produtos" className="ml-auto underline">
            Ver produtos
          </Link>
        </p>
      )}

      {previa &&
        (vencida ? (
          <p className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-amber-900">
            <AlertCircle className="h-5 w-5 shrink-0" /> Esta prévia venceu (vale 24 horas). Envie a planilha de novo.
          </p>
        ) : (
          <>
            {resumo.erros > 0 && (
              <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                As linhas com erro serão ignoradas. Você pode corrigir a planilha e enviar de novo, ou salvar só as linhas
                certas.
              </p>
            )}
            <BotoesImportacao id={importacao.id} alteracoes={alteracoes} />
          </>
        ))}

      {GRUPOS.map((g) => {
        const doGrupo = linhas.filter((l) => l.tipo === g.tipo);
        if (doGrupo.length === 0) return null;
        return (
          <section key={g.tipo} className="space-y-2">
            <h2 className="font-bold">
              {g.titulo} ({doGrupo.length})
            </h2>
            <ul className="space-y-2">
              {doGrupo.map((l) => (
                <li key={l.linha} className={`rounded-xl border p-3 text-sm ${g.cor}`}>
                  <p className="font-semibold">
                    <span className="mr-1 rounded bg-slate-200 px-1.5 py-0.5 text-xs font-bold text-slate-700">Linha {l.linha}</span>
                    {l.nome || l.codigo || "(sem código)"}
                    {l.embalagem && <span className="font-normal text-slate-500"> · {l.embalagem}</span>}
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
