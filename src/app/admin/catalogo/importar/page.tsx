// Importar produtos de marca por planilha (ex.: catálogo enviado por um fabricante).
import Link from "next/link";
import { ChevronLeft, FileSpreadsheet } from "lucide-react";
import { textoResumoCatalogo, type ResumoCatalogo } from "@/domain/importacao-catalogo";
import { exigirAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { SITUACAO_IMPORTACAO } from "@/app/loja/importar/situacao";
import { FormularioImportacaoCatalogo } from "./FormularioImportacaoCatalogo";

export const metadata = { title: "Importar catálogo de marca" };

export default async function ImportarCatalogo() {
  await exigirAdmin();
  const historico = await db.catalogImport.findMany({ orderBy: { createdAt: "desc" }, take: 20 });
  return (
    <div className="space-y-5">
      <Link href="/admin/catalogo" className="inline-flex items-center gap-1 text-sm text-slate-600">
        <ChevronLeft className="h-4 w-4" /> Produtos de marca
      </Link>
      <h2 className="text-lg font-bold">Importar produtos de marca por planilha</h2>
      <p className="text-sm text-slate-600">
        Para cadastrar vários produtos de uma vez a partir do catálogo de um fabricante. O código de barras identifica cada
        produto: novos são criados e os que já existem são atualizados. Nada é gravado antes de você conferir o resumo.
      </p>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- arquivo para baixar, não uma página */}
      <a
        href="/admin/catalogo/importar/modelo"
        className="flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 py-3 font-semibold text-emerald-800"
      >
        <FileSpreadsheet className="h-5 w-5" /> Baixar o modelo (Excel), com os produtos atuais
      </a>
      <FormularioImportacaoCatalogo />
      <section className="space-y-2">
        <h3 className="font-bold">Histórico</h3>
        {historico.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma planilha enviada ainda.</p>
        ) : (
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {historico.map((h) => (
              <li key={h.id}>
                <Link href={`/admin/catalogo/importar/${h.id}`} className="block px-4 py-3 text-sm hover:bg-slate-50">
                  <span className="font-medium break-all">{h.fileName}</span>{" "}
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${SITUACAO_IMPORTACAO[h.status]?.cor}`}>
                    {SITUACAO_IMPORTACAO[h.status]?.rotulo}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {h.createdAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" })} ·{" "}
                    {h.adminName} · {textoResumoCatalogo(JSON.parse(h.summary) as ResumoCatalogo)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
