// =============================================================================
// Quantidades: validação e textos
// =============================================================================

import { QUANTIDADE_MAXIMA } from "@/config/carrinho";

/** "2,5" ou "2.5" -> 2.5 (null se não for número) */
export function lerQuantidade(texto: string): number | null {
  const n = Number(texto.trim().replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** 2.5 -> "2,5"; 3 -> "3" */
export function formatarQuantidade(q: number): string {
  return q.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

/** Confere se a quantidade é aceita (maior que zero e múltipla do passo da oferta) */
export function validarQuantidade(q: number, passo: number): string | null {
  if (!Number.isFinite(q) || q <= 0) return "Informe uma quantidade maior que zero.";
  if (q > QUANTIDADE_MAXIMA) return "Quantidade muito alta. Confira o número digitado.";
  const multiplos = q / passo;
  if (Math.abs(multiplos - Math.round(multiplos)) > 1e-9) {
    return passo === 1
      ? "Este produto é vendido só em quantidades inteiras."
      : `Este produto é vendido de ${formatarQuantidade(passo)} em ${formatarQuantidade(passo)}.`;
  }
  return null;
}

/** Arredonda para o múltiplo do passo mais próximo (sem ficar abaixo de 1 passo) */
export function ajustarAoPasso(q: number, passo: number): number {
  return Math.max(passo, Math.round(q / passo) * passo);
}

// Plurais que não seguem a regra de "acrescentar s"
const PLURAIS_IRREGULARES: Record<string, string> = {
  painel: "painéis",
  "m³": "m³",
  "m²": "m²",
};

/**
 * Nome da embalagem para usar em frases, a partir do rótulo da oferta.
 * "Saco 50 kg" -> "saco" / "sacos";  "m³" -> "m³";  "Milheiro" -> "milheiros"
 */
export function nomeDaEmbalagem(rotulo: string, quantidade: number): string {
  const palavra = rotulo.split(" ")[0].toLowerCase();
  if (quantidade <= 1) return palavra;
  return PLURAIS_IRREGULARES[palavra] ?? `${palavra}s`;
}
