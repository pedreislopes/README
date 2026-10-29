// =============================================================================
// Fotos dos produtos: conferir, otimizar e guardar
// =============================================================================
// Toda foto recebida é aberta e REGRAVADA pelo servidor (biblioteca sharp):
//   - confere se é mesmo JPG, PNG ou WEBP (pelo conteúdo, não pelo nome);
//   - gira conforme a orientação da câmera;
//   - remove dados escondidos (localização GPS, modelo do celular...);
//   - gera uma versão grande e uma miniatura em WebP, leves para o celular.
// As fotos ficam no banco de dados (o site na Vercel não guarda arquivos).
// =============================================================================

import sharp from "sharp";
import {
  FOTO_LADO_GRANDE,
  FOTO_LADO_MINIATURA,
  FOTO_MAX_BYTES,
  FOTO_MAX_MB,
  FOTO_MAX_PIXELS,
  FORMATOS_FOTO,
  NOMES_FORMATOS_FOTO,
} from "@/config/fotos";

export type FotoProcessada = { large: Uint8Array<ArrayBuffer>; thumb: Uint8Array<ArrayBuffer>; width: number; height: number; sizeBytes: number };

export async function processarFoto(arquivo: File | null | undefined): Promise<FotoProcessada | { erro: string }> {
  if (!arquivo || arquivo.size === 0) return { erro: "Escolha a foto." };
  if (arquivo.size > FOTO_MAX_BYTES) return { erro: `A foto passa de ${FOTO_MAX_MB} MB. Escolha uma foto menor.` };
  return otimizarImagem(Buffer.from(await arquivo.arrayBuffer()));
}

/** Confere e otimiza uma imagem já lida (usado também pelos dados de teste) */
export async function otimizarImagem(entrada: Buffer): Promise<FotoProcessada | { erro: string }> {
  try {
    const info = await sharp(entrada, { limitInputPixels: FOTO_MAX_PIXELS }).metadata();
    if (!info.format || !(FORMATOS_FOTO as readonly string[]).includes(info.format)) {
      return { erro: `Formato não aceito. Envie uma foto ${NOMES_FORMATOS_FOTO}.` };
    }
    if ((info.width ?? 0) < 200 || (info.height ?? 0) < 200) {
      return { erro: "A foto é pequena demais (mínimo 200 × 200 pixels)." };
    }
    const base = () =>
      sharp(entrada, { limitInputPixels: FOTO_MAX_PIXELS })
        .rotate() // orientação da câmera
        .flatten({ background: "#ffffff" }); // transparência vira fundo branco
    const grande = await base()
      .resize(FOTO_LADO_GRANDE, FOTO_LADO_GRANDE, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true });
    const mini = await base()
      .resize(FOTO_LADO_MINIATURA, FOTO_LADO_MINIATURA, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 72 })
      .toBuffer();
    return {
      large: new Uint8Array(grande.data),
      thumb: new Uint8Array(mini),
      width: grande.info.width,
      height: grande.info.height,
      sizeBytes: grande.data.length,
    };
  } catch {
    return { erro: `Não conseguimos abrir esta imagem. Envie uma foto ${NOMES_FORMATOS_FOTO}.` };
  }
}
