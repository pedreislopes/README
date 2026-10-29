"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { Alerta, estiloBotaoPrincipal } from "@/components/Formulario";
import { confirmarImportacao, descartarImportacao } from "@/lib/acoes-importacao";

export function BotoesImportacao({ id, alteracoes }: { id: string; alteracoes: number }) {
  const [enviando, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      {erro && <Alerta>{erro}</Alerta>}
      <button
        type="button"
        disabled={enviando || alteracoes === 0}
        onClick={() =>
          iniciar(async () => {
            const r = await confirmarImportacao(id);
            setErro(r.erro ?? null);
          })
        }
        className={`${estiloBotaoPrincipal} flex items-center justify-center gap-2`}
      >
        <Check className="h-5 w-5" />
        {enviando
          ? "Salvando…"
          : alteracoes === 0
            ? "Nada para salvar"
            : `Confirmar e salvar ${alteracoes} ${alteracoes === 1 ? "alteração" : "alterações"}`}
      </button>
      <button
        type="button"
        disabled={enviando}
        onClick={() => iniciar(() => descartarImportacao(id).then(() => undefined))}
        className="w-full rounded-xl border border-slate-300 bg-white py-3 font-semibold text-slate-700"
      >
        Descartar e enviar outra planilha
      </button>
    </div>
  );
}
