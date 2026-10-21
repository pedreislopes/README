// Regras do catálogo de materiais (gerenciado pelo administrador)

import { normalizar } from "./busca";

/** Código do material a partir do nome: "Bloco de concreto 19x19x39 cm" -> "bloco-de-concreto-19x19x39-cm" */
export function gerarIdMaterial(nome: string, existentes: Set<string>): string {
  const base =
    normalizar(nome)
      .replace(/(\d) x (\d)/g, "$1x$2") // "19 x 19" volta a ser "19x19"
      .replace(/\s+/g, "-")
      .slice(0, 60) || "material";
  let id = base;
  for (let n = 2; existentes.has(id); n++) id = `${base}-${n}`;
  return id;
}

/** Motivos de recusa/suspensão precisam de um mínimo de explicação */
export function validarMotivoAdmin(motivo: string): string | null {
  return motivo.trim().length < 5 ? "Escreva o motivo (pelo menos 5 letras). Ele será mostrado ao lojista." : null;
}
