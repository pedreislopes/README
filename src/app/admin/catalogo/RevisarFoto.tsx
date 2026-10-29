"use client";

import { useState, useTransition } from "react";
import { aprovarFoto, recusarFoto } from "@/lib/acoes-catalogo";
import { urlDaFoto } from "@/config/fotos";

type Envio = { id: string; fotoId: string; produto: string; loja: string; origem: string; autorizacao: string; data: string };

export function RevisarFoto({ envio }: { envio: Envio }) {
  const [enviando, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [recusando, setRecusando] = useState(false);
  const [motivo, setMotivo] = useState("");
  return (
    <article className="space-y-3 rounded-2xl border border-amber-300 bg-white p-4">
      <div className="flex gap-3">
        <a href={urlDaFoto(envio.fotoId)} target="_blank" rel="noreferrer" className="shrink-0" aria-label="Abrir a foto em tamanho grande">
          {/* eslint-disable-next-line @next/next/no-img-element -- foto ainda não pública, só o administrador vê */}
          <img src={urlDaFoto(envio.fotoId, true)} alt={`Foto enviada: ${envio.produto}`} className="h-24 w-24 rounded-lg border border-slate-200 object-contain" />
        </a>
        <div className="min-w-0 text-sm">
          <p className="font-bold">{envio.produto}</p>
          <p className="text-slate-600">
            Enviada por <strong>{envio.loja}</strong> em {envio.data}
          </p>
          <p className="text-slate-600">Origem: {envio.origem}</p>
          <p className="text-slate-600">Autorização: {envio.autorizacao}</p>
        </div>
      </div>
      {recusando ? (
        <div className="space-y-2">
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={2}
            placeholder="Motivo (a loja verá este texto). Ex.: foto com logotipo de outra loja"
            aria-label="Motivo da recusa"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base"
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => setRecusando(false)} className="flex-1 rounded-lg border border-slate-300 py-2.5 font-semibold">
              Voltar
            </button>
            <button
              type="button"
              disabled={enviando}
              onClick={() => iniciar(async () => setErro((await recusarFoto(envio.id, motivo)).erro ?? null))}
              className="flex-1 rounded-lg bg-red-700 py-2.5 font-bold text-white disabled:opacity-60"
            >
              Confirmar recusa
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={enviando}
            onClick={() => iniciar(async () => setErro((await aprovarFoto(envio.id)).erro ?? null))}
            className="flex-1 rounded-lg bg-emerald-600 py-2.5 font-bold text-white disabled:opacity-60"
          >
            Aprovar foto
          </button>
          <button type="button" onClick={() => setRecusando(true)} className="flex-1 rounded-lg border border-slate-300 py-2.5 font-semibold">
            Recusar
          </button>
        </div>
      )}
      {erro && <p className="text-sm font-medium text-red-600">{erro}</p>}
    </article>
  );
}
