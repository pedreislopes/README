"use client";

import { useActionState } from "react";
import { Upload } from "lucide-react";
import { Alerta, estiloBotaoPrincipal } from "@/components/Formulario";
import { previaImportacao } from "@/lib/acoes-importacao";

export function FormularioImportacao() {
  const [estado, acao, enviando] = useActionState(previaImportacao, {});
  return (
    <form action={acao} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      {estado.erro && <Alerta>{estado.erro}</Alerta>}
      <label htmlFor="planilha" className="block text-sm font-semibold">
        Planilha preenchida (.xlsx ou .csv, até 1 MB)
      </label>
      <input
        id="planilha"
        name="planilha"
        type="file"
        required
        accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
        className="block w-full rounded-lg border border-slate-300 bg-white p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-marca-50 file:px-3 file:py-2 file:font-semibold file:text-marca-700"
      />
      <button type="submit" disabled={enviando} className={`${estiloBotaoPrincipal} flex items-center justify-center gap-2`}>
        <Upload className="h-5 w-5" /> {enviando ? "Lendo a planilha…" : "Ver o que vai mudar"}
      </button>
      <p className="text-xs text-slate-500">Nada é gravado agora: primeiro você confere o resumo.</p>
    </form>
  );
}
