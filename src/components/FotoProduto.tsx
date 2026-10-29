"use client";

// Foto de um produto de marca. Ao tocar, abre ampliada (tela cheia, com fundo escuro).
// Sem foto aprovada, mostra a ilustração da categoria: nunca fica um espaço vazio.

import Image from "next/image";
import { useRef } from "react";
import { X } from "lucide-react";
import { urlDaFoto } from "@/config/fotos";
import { imagemDaCategoria } from "@/config/imagens-categorias";

type Props = {
  fotoId: string | null;
  categoria: string;
  /** Texto para leitores de tela, ex.: "Forja Cerrado MU-27" */
  descricao: string;
  /** Lado do quadrado, em pixels de tela */
  tamanho?: number;
  className?: string;
};


export function FotoProduto({ fotoId, categoria, descricao, tamanho = 72, className = "" }: Props) {
  const janela = useRef<HTMLDialogElement>(null);
  const caixa = `relative block shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white ${className}`;

  if (!fotoId) {
    return (
      <span className={caixa} style={{ width: tamanho, height: tamanho }}>
        <Image
          src={imagemDaCategoria(categoria)}
          alt={`${descricao} (sem foto: ilustração da categoria ${categoria})`}
          fill
          sizes={`${tamanho * 2}px`}
          className="object-cover opacity-90"
        />
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => janela.current?.showModal()}
        className={`${caixa} cursor-zoom-in focus-visible:ring-2 focus-visible:ring-marca-500 focus-visible:outline-none`}
        style={{ width: tamanho, height: tamanho }}
        aria-label={`Ampliar foto: ${descricao}`}
      >
        {/* A foto já é guardada otimizada (WebP) pelo servidor */}
        <Image src={urlDaFoto(fotoId, tamanho <= 180)} alt={descricao} fill unoptimized className="object-contain p-1" />
      </button>
      <dialog
        ref={janela}
        aria-label={`Foto: ${descricao}`}
        onClick={(e) => e.target === janela.current && janela.current?.close()}
        className="m-auto w-[min(92vw,640px)] rounded-2xl bg-white p-0 backdrop:bg-slate-900/80"
      >
        <div className="relative">
          <button
            type="button"
            onClick={() => janela.current?.close()}
            className="absolute top-2 right-2 z-10 rounded-full bg-white/90 p-2 text-slate-700 shadow"
            aria-label="Fechar foto"
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element -- foto já otimizada; tamanho real varia */}
          <img src={urlDaFoto(fotoId)} alt={descricao} className="h-auto max-h-[80vh] w-full object-contain" loading="lazy" />
          <p className="px-4 py-3 text-sm font-semibold text-slate-800">{descricao}</p>
        </div>
      </dialog>
    </>
  );
}
