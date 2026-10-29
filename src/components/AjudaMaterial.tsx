"use client";

// Ícone "?" ao lado do nome do material. Ao tocar, abre uma explicação curta:
// o que é, para que serve e quando usar. Os textos ficam em
// src/config/explicacoes-materiais.ts (revisados pelo engenheiro).

import { useId, useState } from "react";
import { CircleHelp, X } from "lucide-react";
import { AVISO_EXPLICACAO, type Explicacao } from "@/config/explicacoes-materiais";

type Props = {
  nome: string;
  explicacao: Pick<Explicacao, "oQueE" | "paraQue" | "quandoUsar">;
};

export function AjudaMaterial({ nome, explicacao }: Props) {
  const [aberto, setAberto] = useState(false);
  const id = useId();

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        aria-expanded={aberto}
        aria-controls={id}
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-marca-700 align-middle hover:bg-marca-50 focus-visible:ring-2 focus-visible:ring-marca-300 focus-visible:outline-none"
        title={`O que é ${nome}?`}
      >
        <CircleHelp className="h-5 w-5" aria-hidden />
        <span className="sr-only">O que é {nome}?</span>
      </button>
      {aberto && (
        <div
          id={id}
          role="note"
          className="relative mt-2 basis-full rounded-xl border border-marca-100 bg-marca-50 p-3 pr-9 text-sm font-normal text-slate-800"
        >
          <button
            type="button"
            onClick={() => setAberto(false)}
            className="absolute top-2 right-2 rounded p-1 text-slate-500 hover:text-slate-800"
            aria-label="Fechar explicação"
          >
            <X className="h-4 w-4" />
          </button>
          <dl className="space-y-1.5">
            <div>
              <dt className="inline font-semibold">O que é: </dt>
              <dd className="inline">{explicacao.oQueE}</dd>
            </div>
            <div>
              <dt className="inline font-semibold">Para que serve: </dt>
              <dd className="inline">{explicacao.paraQue}</dd>
            </div>
            <div>
              <dt className="inline font-semibold">Quando usar: </dt>
              <dd className="inline">{explicacao.quandoUsar}</dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-slate-500">{AVISO_EXPLICACAO}</p>
        </div>
      )}
    </>
  );
}
