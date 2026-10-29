// Importar produtos por planilha: baixar o modelo, enviar e ver o histórico.
import Link from "next/link";
import { ChevronLeft, FileSpreadsheet, FileText } from "lucide-react";
import { textoDoResumo, type ResumoImportacao } from "@/domain/importacao";
import { db } from "@/lib/db";
import { exigirLoja } from "@/lib/loja";
import { FormularioImportacao } from "./FormularioImportacao";
import { SITUACAO_IMPORTACAO } from "./situacao";

export const metadata = { title: "Importar planilha" };

export default async function ImportarPlanilha() {
  const { loja } = await exigirLoja();
  const historico = await db.storeImport.findMany({
    where: { storeId: loja.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, fileName: true, userName: true, status: true, summary: true, createdAt: true },
  });

  return (
    <div className="space-y-5">
      <Link href="/loja/produtos" className="inline-flex items-center gap-1 text-sm text-slate-600">
        <ChevronLeft className="h-4 w-4" /> Voltar para os produtos
      </Link>
      <header>
        <h1 className="text-xl font-extrabold">Importar produtos por planilha</h1>
        <p className="mt-1 text-sm text-slate-600">
          Atualize muitos preços de uma vez: baixe o modelo, preencha no Excel e envie aqui.
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="font-bold">1. Baixe o modelo</h2>
        <p className="text-sm text-slate-600">
          Ele já vem com os seus produtos. A aba <strong>Materiais</strong> traz os códigos do catálogo e a aba{" "}
          <strong>Instruções</strong> explica cada coluna.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {/* <a> e não <Link>: é um arquivo para baixar, não uma página */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/loja/importar/modelo?formato=xlsx"
            className="flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 py-3 font-semibold text-emerald-800"
          >
            <FileSpreadsheet className="h-5 w-5" /> Excel (.xlsx)
          </a>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/loja/importar/modelo?formato=csv"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-3 font-semibold text-slate-700"
          >
            <FileText className="h-5 w-5" /> CSV
          </a>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-bold">2. Preencha e envie</h2>
        <FormularioImportacao />
        <p className="text-xs text-slate-500">
          Produtos que não estiverem na planilha continuam como estão. Para tirar um produto da busca, use “não” na coluna{" "}
          <em>disponivel</em>.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-bold">Histórico de importações</h2>
        {historico.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma planilha enviada ainda.</p>
        ) : (
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {historico.map((h) => {
              const situacao = SITUACAO_IMPORTACAO[h.status] ?? SITUACAO_IMPORTACAO.DESCARTADA;
              return (
                <li key={h.id}>
                  <Link href={`/loja/importar/${h.id}`} className="block px-4 py-3 hover:bg-slate-50">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium break-all">{h.fileName}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${situacao.cor}`}>{situacao.rotulo}</span>
                    </span>
                    <span className="block text-xs text-slate-500">
                      {h.createdAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" })}{" "}
                      · {h.userName} · {textoDoResumo(JSON.parse(h.summary) as ResumoImportacao)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
