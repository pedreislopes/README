"use client";

// Selo "Oferta destaque" + aviso "Patrocinado" sempre visível.
// O ícone (i) abre/fecha a explicação ao ser tocado.

import { useState } from "react";
import { Info, Sparkles } from "lucide-react";
import { DESTAQUE } from "@/config/constantes";

export function SeloDestaque() {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
          <Sparkles className="h-3.5 w-3.5" /> {DESTAQUE.selo}
        </span>
        <button
          type="button"
          onClick={() => setAberto(!aberto)}
          aria-expanded={aberto}
          className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[11px] text-slate-500 hover:text-slate-700"
        >
          {DESTAQUE.aviso}
          <Info className="h-3 w-3" aria-hidden />
          <span className="sr-only">: o que significa?</span>
        </button>
      </div>
      {aberto && (
        <p role="note" className="max-w-xs rounded-md bg-slate-800 px-2.5 py-1.5 text-xs text-white">
          {DESTAQUE.explicacao}
        </p>
      )}
    </div>
  );
}
