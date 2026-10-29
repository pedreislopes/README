"use client";

import { useState, useTransition } from "react";
import { Alerta, estiloBotaoPrincipal } from "@/components/Formulario";
import { confirmarImportacaoCatalogo, descartarImportacaoCatalogo } from "@/lib/acoes-catalogo";

export function BotoesCatalogo({ id, alteracoes }: { id: string; alteracoes: number }) {
  const [enviando, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      {erro && <Alerta>{erro}</Alerta>}
      <button
        type="button"
        disabled={enviando || alteracoes === 0}
        onClick={() => iniciar(async () => setErro((await confirmarImportacaoCatalogo(id)).erro ?? null))}
        className={estiloBotaoPrincipal}
      >
        {enviando ? "Salvando…" : alteracoes === 0 ? "Nada para salvar" : `Confirmar e salvar ${alteracoes} ${alteracoes === 1 ? "produto" : "produtos"}`}
      </button>
      <button
        type="button"
        disabled={enviando}
        onClick={() => iniciar(() => descartarImportacaoCatalogo(id))}
        className="w-full rounded-xl border border-slate-300 bg-white py-3 font-semibold text-slate-700"
      >
        Descartar
      </button>
    </div>
  );
}
