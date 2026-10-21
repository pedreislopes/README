"use client";

// Botão "Cancelar pedido" que abre a escolha do motivo antes de confirmar.

import { useState, useTransition } from "react";
import { XCircle } from "lucide-react";
import { cancelarPedido } from "@/lib/acoes-pedidos";

export function CancelarPedido({ orderId, motivos }: { orderId: string; motivos: readonly string[] }) {
  const [aberto, setAberto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [detalhe, setDetalhe] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-3 text-sm font-semibold text-red-700 hover:bg-red-50"
      >
        <XCircle className="h-4 w-4" /> Cancelar pedido
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-3">
      <p className="text-sm font-bold text-red-800">Por que o pedido será cancelado?</p>
      <div className="grid gap-1.5">
        {motivos.map((m) => (
          <label key={m} className="flex items-center gap-2 text-sm">
            <input type="radio" name={`motivo-${orderId}`} checked={motivo === m} onChange={() => setMotivo(m)} className="h-4 w-4 accent-red-600" />
            {m}
          </label>
        ))}
      </div>
      <textarea
        value={detalhe}
        onChange={(e) => setDetalhe(e.target.value)}
        rows={2}
        maxLength={300}
        placeholder={motivo === "Outro" ? "Explique o motivo (obrigatório)" : "Observação (opcional)"}
        aria-label="Detalhes do motivo"
        className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-base"
      />
      {erro && <p className="text-sm font-medium text-red-700">{erro}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setAberto(false);
            setErro(null);
          }}
          className="flex-1 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-semibold"
        >
          Voltar
        </button>
        <button
          type="button"
          disabled={enviando}
          onClick={() =>
            iniciar(async () => {
              const r = await cancelarPedido(orderId, motivo, detalhe);
              setErro(r.erro ?? null);
            })
          }
          className="flex-1 rounded-lg bg-red-700 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {enviando ? "Cancelando…" : "Confirmar cancelamento"}
        </button>
      </div>
    </div>
  );
}
