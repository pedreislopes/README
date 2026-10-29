"use client";

// Campo para escolher uma foto (celular ou computador).
// Antes de enviar, o próprio navegador:
//   1. confere o formato (JPG, PNG ou WEBP) e o tamanho (até 5 MB);
//   2. reduz a foto para no máximo 2000 px, com fundo branco, em JPG.
// Assim o envio é rápido no 4G. O servidor confere e otimiza de novo (src/lib/fotos.ts).

import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { ACCEPT_FOTO, FOTO_LADO_ENVIO, FOTO_MAX_BYTES, FOTO_MAX_MB, NOMES_FORMATOS_FOTO } from "@/config/fotos";

async function reduzir(arquivo: File): Promise<File> {
  const url = URL.createObjectURL(arquivo);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const escala = Math.min(1, FOTO_LADO_ENVIO / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * escala);
    canvas.height = Math.round(img.naturalHeight * escala);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/jpeg", 0.9));
    if (!blob) return arquivo;
    return new File([blob], arquivo.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function CampoFoto({ name = "foto", rotulo = "Foto do produto", obrigatoria = true }: { name?: string; rotulo?: string; obrigatoria?: boolean }) {
  const campo = useRef<HTMLInputElement>(null);
  const [previa, setPrevia] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [preparando, setPreparando] = useState(false);

  async function escolher(arquivo: File | undefined) {
    setErro(null);
    setPrevia(null);
    if (!arquivo || !campo.current) return;
    if (!ACCEPT_FOTO.split(",").includes(arquivo.type)) {
      campo.current.value = "";
      return setErro(`Formato não aceito. Escolha uma foto ${NOMES_FORMATOS_FOTO}.`);
    }
    if (arquivo.size > FOTO_MAX_BYTES) {
      campo.current.value = "";
      return setErro(`A foto passa de ${FOTO_MAX_MB} MB. Escolha uma foto menor.`);
    }
    setPreparando(true);
    try {
      const reduzida = await reduzir(arquivo);
      const lista = new DataTransfer();
      lista.items.add(reduzida);
      campo.current.files = lista.files;
      setPrevia(URL.createObjectURL(reduzida));
    } catch {
      // Se o navegador não conseguir reduzir, envia a original (o servidor confere)
      setPrevia(URL.createObjectURL(arquivo));
    } finally {
      setPreparando(false);
    }
  }

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-semibold">
        {rotulo} {!obrigatoria && <span className="font-normal text-slate-500">(opcional)</span>}
      </label>
      <div className="mt-1 flex items-center gap-3">
        <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
          {previa ? (
            // eslint-disable-next-line @next/next/no-img-element -- prévia local, antes do envio
            <img src={previa} alt="Prévia da foto escolhida" className="h-full w-full object-contain" />
          ) : (
            <ImagePlus className="h-8 w-8 text-slate-300" aria-hidden />
          )}
        </span>
        <input
          ref={campo}
          id={name}
          name={name}
          type="file"
          accept={ACCEPT_FOTO}
          required={obrigatoria}
          onChange={(e) => void escolher(e.target.files?.[0])}
          className="block w-full min-w-0 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-marca-50 file:px-3 file:py-2 file:font-semibold file:text-marca-700"
        />
      </div>
      <p className="mt-1 text-xs text-slate-500">
        {preparando ? "Preparando a foto…" : `${NOMES_FORMATOS_FOTO}, até ${FOTO_MAX_MB} MB. De preferência com fundo branco.`}
      </p>
      {erro && (
        <p role="alert" className="mt-1 text-sm font-medium text-red-700">
          {erro}
        </p>
      )}
    </div>
  );
}
