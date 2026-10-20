"use client";

import { useTransition } from "react";
import { ArrowRight } from "lucide-react";
import { avancarStatus } from "@/lib/acoes-loja";

export function BotaoAvancar({ orderId, rotulo }: { orderId: string; rotulo: string }) {
  const [enviando, iniciar] = useTransition();
  return (
    <button
      type="button"
      disabled={enviando}
      onClick={() => iniciar(async () => void (await avancarStatus(orderId)))}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-base font-bold text-white hover:bg-slate-800 disabled:opacity-60"
    >
      {enviando ? "Salvando…" : rotulo} <ArrowRight className="h-5 w-5" />
    </button>
  );
}
